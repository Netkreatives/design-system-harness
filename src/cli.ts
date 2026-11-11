#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { HarnessError } from './model';
import { loadProject, build, current, lookup, search, flow } from './catalog';

const usage = `Design System Harness — reference CLI

bun run design --config <design.config.json> <command> [--json]

Commands:
  build                       Extract public APIs and write a local catalog
  docs search <words>          Find component IDs (at most 20)
  docs lookup <name-or-id>     Retrieve one contract and authored guidance
  flows lookup <id>           Retrieve one authored flow and example
  check                       Execute the project's explicitly configured checks

Lookup/search never rebuild, install packages, or execute project checks.
All output is JSON except this help. Check processes run with the config directory as CWD.
`;

function run() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) { console.log(usage); return; }
  let config = 'design.config.json';
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === '--config') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new HarnessError('USAGE', '--config needs a path');
      config = value;
    } else if (arg === '--json') { /* JSON is also the default. */ }
    else if (arg.startsWith('-')) throw new HarnessError('USAGE', `Unknown option ${arg}`);
    else positional.push(arg);
  }
  const [command, action, ...rest] = positional;
  const valid = ((command === 'build' || command === 'check') && positional.length === 1)
    || (command === 'docs' && ['search', 'lookup'].includes(action ?? '') && rest.length === 1 && rest[0]!.trim() !== '')
    || (command === 'flows' && action === 'lookup' && rest.length === 1);
  if (!valid) throw new HarnessError('USAGE', 'Invalid command. Use --help; quote multiword search text.');
  const project = loadProject(resolve(config));
  const catalog = command === 'build' ? build(project) : current(project);
  let data: unknown;
  let ok = true;
  if (command === 'build') data = { components: catalog.components.map(c => ({ id: c.id, status: c.contract.status })), output: '.design/catalog.json' };
  else if (command === 'docs') data = action === 'search' ? search(project, catalog, rest[0]!) : lookup(project, catalog, rest[0]!);
  else if (command === 'flows') data = flow(project, rest[0]!);
  else {
    const checks = project.config.checks.map(check => {
      // No shell interpolation. Configuration is trusted local code, not a sandbox.
      const result = spawnSync(check.argv[0]!, check.argv.slice(1), {
        cwd: project.root, encoding: 'utf8', timeout: check.timeoutMs, maxBuffer: 1024 * 1024,
      });
      const status = result.error ? 'error' : result.signal ? 'interrupted' : result.status === 0 ? 'passed' : 'failed';
      return { name: check.name, scope: check.scope, argv: check.argv, status, exitCode: result.status,
        signal: result.signal, error: result.error?.message, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
    });
    // A check that edits an input invalidates the evidence for the starting fingerprint.
    current(project);
    ok = checks.length > 0 && checks.every(c => c.status === 'passed');
    data = { status: checks.length === 0 ? 'not-configured' : ok ? 'passed' : 'failed', checks,
      claim: 'Only the listed checks ran. No visual, usability, or comprehensive accessibility approval is implied.' };
  }
  console.log(JSON.stringify({ schemaVersion: 1, ok, command: positional.slice(0, command === 'docs' || command === 'flows' ? 2 : 1).join(' '),
    system: catalog.system, fingerprint: catalog.fingerprint, data }, null, 2));
  if (!ok) process.exitCode = 1;
}

try { run(); }
catch (error) {
  const e = error instanceof HarnessError ? error : new HarnessError('INTERNAL_ERROR', String(error));
  console.log(JSON.stringify({ schemaVersion: 1, ok: false, error: { code: e.code, message: e.message, details: e.details } }, null, 2));
  console.error(`${e.code}: ${e.message}`);
  process.exitCode = 1;
}
