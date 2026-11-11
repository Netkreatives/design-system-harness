import ts from 'typescript';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, realpathSync, statSync, existsSync, mkdirSync, writeFileSync, renameSync, lstatSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { Catalog, Component, Config, Guidance, Flows, HarnessError } from './model';

const toolRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const stable = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

function json<T>(file: string, schema: z.ZodType<T>): T {
  try { return schema.parse(JSON.parse(readFileSync(file, 'utf8'))); }
  catch (error) { throw new HarnessError('INVALID_INPUT', `Cannot read or validate ${file}`, String(error)); }
}

// Config paths are relative to its directory; outputs never follow the caller's CWD.
function local(root: string, path: string): string {
  const full = resolve(root, path);
  const rel = relative(root, full);
  if (isAbsolute(path) || rel === '..' || rel.startsWith('../')) {
    throw new HarnessError('INVALID_PATH', `Expected a path inside the design-system directory: ${path}`);
  }
  return full;
}

export function loadProject(configPath: string) {
  const file = resolve(configPath);
  const root = dirname(file);
  const config = json(file, Config);
  const guidance = json(local(root, config.guidance), Guidance);
  const flows = json(local(root, config.flows), Flows);
  for (const [kind, ids] of [
    ['component', config.entries.flatMap(e => e.names.map(name => `${e.importPath}#${name}`))],
    ['guidance', guidance.map(g => g.componentId)], ['flow', flows.map(f => f.id)],
    ['check', config.checks.map(c => c.name)],
  ] as const) {
    if (new Set(ids).size !== ids.length) throw new HarnessError('DUPLICATE_ID', `Duplicate ${kind} identifier`);
  }
  const known = new Set(config.entries.flatMap(e => e.names.map(n => `${e.importPath}#${n}`)));
  for (const id of [...guidance.map(g => g.componentId), ...flows.flatMap(f => f.components)]) {
    if (!known.has(id)) throw new HarnessError('UNKNOWN_REFERENCE', `Authored guidance references unknown component ${id}`);
  }
  for (const path of [config.tsconfig, config.consumer, ...config.entries.map(e => e.file), ...config.inputs,
    ...guidance.map(g => g.example), ...flows.map(f => f.example)]) local(root, path);
  return { file, root, config, guidance, flows, output: join(root, '.design/catalog.json') };
}
export type Project = ReturnType<typeof loadProject>;

function walk(path: string): string[] {
  if (!existsSync(path)) throw new HarnessError('MISSING_INPUT', `Missing input: ${path}`);
  if (lstatSync(path).isSymbolicLink()) throw new HarnessError('SYMLINK_INPUT', `Use an explicit source path instead of a symlink input: ${path}`);
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).sort(stable).filter(n => !['.git', 'node_modules', '.design', '.tmp', '.preview'].includes(n))
    .flatMap(name => walk(join(path, name)));
}

function fingerprint(project: Project, dependencies: string[]): string {
  const files = new Set([project.file, local(project.root, project.config.tsconfig),
    local(project.root, project.config.consumer), local(project.root, project.config.guidance), local(project.root, project.config.flows),
    ...project.config.entries.map(e => local(project.root, e.file)),
    ...project.config.inputs.flatMap(path => walk(local(project.root, path))),
    ...project.guidance.map(g => local(project.root, g.example)),
    ...project.flows.map(f => local(project.root, f.example)),
    ...dependencies.map(path => resolve(project.root, path)),
  ]);
  const pairs = [...files].map(file => {
    if (!existsSync(file)) throw new HarnessError('STALE_CATALOG', `Previously indexed input is missing: ${relative(project.root, file)}`);
    return [relative(project.root, file), hash(readFileSync(file))];
  });
  // Include the actual implementation and dependency lock, not just a Git commit.
  for (const path of ['src/model.ts', 'src/catalog.ts', 'src/cli.ts', 'package.json', 'bun.lock']) {
    pairs.push([`$extractor/${path}`, hash(readFileSync(join(toolRoot, path)))]);
  }
  // Lockfiles, manifests, and extended tsconfigs at parent roots also affect resolution.
  let directory = project.root;
  while (true) {
    for (const name of ['package.json', 'bun.lock', 'bun.lockb', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'tsconfig.json']) {
      const file = join(directory, name);
      if (existsSync(file)) pairs.push([`$ancestor/${relative(project.root, file)}`, hash(readFileSync(file))]);
    }
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  pairs.sort((a, b) => stable(a[0]!, b[0]!));
  return hash(JSON.stringify(pairs));
}

function programFor(project: Project) {
  const configFile = local(project.root, project.config.tsconfig);
  const read = ts.readConfigFile(configFile, ts.sys.readFile);
  if (read.error) throw new HarnessError('TSCONFIG_ERROR', ts.flattenDiagnosticMessageText(read.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, dirname(configFile));
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
  if (diagnostics.length) throw new HarnessError('SOURCE_INVALID', 'Fix design-system source errors before extracting', diagnostics.map(d => ({
    file: d.file ? relative(project.root, d.file.fileName) : undefined,
    message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
  })));
  return { program, checker: program.getTypeChecker(), options: parsed.options };
}

export function build(project: Project): Catalog {
  const { program, checker, options } = programFor(project);
  const components: Component[] = [];
  const formats = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
  for (const entry of project.config.entries) {
    const entryFile = local(project.root, entry.file);
    const source = program.getSourceFile(entryFile);
    if (!source) throw new HarnessError('ENTRY_NOT_IN_PROGRAM', `${entry.file} is outside ${project.config.tsconfig}`);
    const resolved = ts.resolveModuleName(entry.importPath, local(project.root, project.config.consumer), options, ts.sys).resolvedModule;
    if (!resolved || realpathSync(resolved.resolvedFileName) !== realpathSync(entryFile)) {
      throw new HarnessError('IMPORT_MISMATCH', `Consumer import ${entry.importPath} does not resolve to ${entry.file}`, {
        resolved: resolved ? relative(project.root, resolved.resolvedFileName) : null,
      });
    }
    const module = checker.getSymbolAtLocation(source);
    if (!module) throw new HarnessError('NOT_MODULE', `No public exports in ${entry.file}`);
    const exports = checker.getExportsOfModule(module);
    for (const name of entry.names) {
      const exported = exports.find(s => s.name === name);
      if (!exported) throw new HarnessError('MISSING_EXPORT', `${entry.importPath} does not export ${name}`);
      const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
      if (!declaration) throw new HarnessError('MISSING_DECLARATION', `No declaration for ${name}`);
      const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
      const signatures = type.getCallSignatures();
      const signature = signatures[0];
      let contract: Component['contract'];
      const signatureText = signature ? checker.signatureToString(signature, declaration, formats) : checker.typeToString(type);
      if (signatures.length !== 1 || !signature || signature.typeParameters?.length || signature.parameters.length !== 1) {
        contract = { status: 'unsupported', reason: 'v1 supports a single non-generic call signature with one object props parameter. Inspect the authoritative source.', signature: signatureText };
      } else {
        const props = checker.getTypeOfSymbolAtLocation(signature.parameters[0]!, declaration);
        const variants = props.isUnion() ? props.types : [props];
        if (variants.some(t => !(t.flags & ts.TypeFlags.Object) || t.getStringIndexType() || t.getNumberIndexType())) {
          contract = { status: 'unsupported', reason: 'Props must be a closed object or union of closed objects; index signatures and unresolved props require an adapter.', signature: signatureText };
        } else {
          const extracted = variants.map(variant => ({
            type: checker.typeToString(variant, declaration, formats),
            props: checker.getPropertiesOfType(variant).map(prop => ({
              name: prop.name,
              type: checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, declaration), declaration, formats),
              required: !(prop.flags & ts.SymbolFlags.Optional),
              description: ts.displayPartsToString(prop.getDocumentationComment(checker)),
            })).sort((a, b) => stable(a.name, b.name)),
          }));
          contract = extracted.some(v => v.props.some(p => p.type === 'any' || p.type === 'unknown'))
            ? { status: 'unsupported', reason: 'Unconstrained any/unknown props require manual contract work.', signature: signatureText }
            : { status: 'supported', signature: signatureText, variants: extracted };
        }
      }
      const publicContract = { importPath: entry.importPath, name, contract };
      components.push({
        id: `${entry.importPath}#${name}`, name, importPath: entry.importPath,
        importStatement: name === 'default' ? `import Component from '${entry.importPath}';` : `import { ${name} } from '${entry.importPath}';`,
        description: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
        source: `${relative(project.root, declaration.getSourceFile().fileName)}:${declaration.getSourceFile().getLineAndCharacterOfPosition(declaration.getStart()).line + 1}`,
        contract, contractHash: hash(JSON.stringify(publicContract)),
      });
    }
  }
  components.sort((a, b) => stable(a.id, b.id));
  const dependencies = [...new Set(program.getSourceFiles().map(s => relative(project.root, s.fileName)))].sort(stable);
  const catalog = Catalog.parse({ schemaVersion: 1, system: project.config.id, fingerprint: fingerprint(project, dependencies),
    compilerVersion: ts.version, extractorVersion: '1', dependencies, components });
  mkdirSync(dirname(project.output), { recursive: true });
  const temp = `${project.output}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(catalog, null, 2) + '\n');
  renameSync(temp, project.output);
  return catalog;
}

export function current(project: Project): Catalog {
  if (!existsSync(project.output)) throw new HarnessError('CATALOG_MISSING', 'Run build explicitly before querying.');
  const catalog = json(project.output, Catalog);
  if (catalog.system !== project.config.id || catalog.fingerprint !== fingerprint(project, catalog.dependencies)) {
    throw new HarnessError('STALE_CATALOG', 'Inputs changed. Run build explicitly; no component data was returned.');
  }
  return catalog;
}

export function lookup(project: Project, catalog: Catalog, query: string) {
  const matches = catalog.components.filter(c => c.id === query || c.name.toLowerCase() === query.toLowerCase());
  if (!matches.length) throw new HarnessError('NOT_FOUND', `No component matches ${query}; search or inspect the source. No substitute was selected.`);
  if (matches.length !== 1) throw new HarnessError('AMBIGUOUS', `Use a full component ID for ${query}`, matches.map(c => c.id));
  const component = matches[0]!;
  if (component.contract.status === 'unsupported') throw new HarnessError('UNSUPPORTED_CONTRACT', component.contract.reason, component);
  const authored = project.guidance.find(g => g.componentId === component.id);
  return { ...component, guidance: authored ? { ...authored,
    review: authored.review.status === 'approved' && authored.review.contractHash !== component.contractHash
      ? { status: 'needs-review', previousApproval: authored.review } : authored.review,
    exampleSource: readFileSync(local(project.root, authored.example), 'utf8'),
  } : null, validation: 'Not executed by lookup. Run check for configured technical checks.' };
}

export function search(project: Project, catalog: Catalog, query: string) {
  const words = query.toLowerCase().trim().split(/\s+/);
  return catalog.components.filter(c => {
    const g = project.guidance.find(g => g.componentId === c.id);
    const haystack = `${c.name} ${c.id} ${c.description} ${g?.intent ?? ''} ${g?.whenToUse ?? ''}`.toLowerCase();
    return words.every(w => haystack.includes(w));
  }).slice(0, 20).map(c => ({ id: c.id, description: c.description, status: c.contract.status,
    next: ['docs', 'lookup', c.id, '--json'] }));
}

export function flow(project: Project, id: string) {
  const found = project.flows.find(f => f.id === id);
  if (!found) throw new HarnessError('NOT_FOUND', `No flow matches ${id}`);
  return { ...found, exampleSource: readFileSync(local(project.root, found.example), 'utf8'),
    note: 'Authored draft flow; component lookup and technical checks do not constitute editorial approval.' };
}
