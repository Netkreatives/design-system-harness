import { test, expect, afterAll } from 'bun:test';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { build, current, loadProject, lookup, search } from '../src/catalog';

const root = resolve(import.meta.dir, '..');
mkdirSync(join(root, '.tmp'), { recursive: true });
const scratch = mkdtempSync(join(root, '.tmp', 'catalog-tests-'));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));
let count = 0;

function fixture() {
  // Keep the same directory depth as examples/fieldwork for configured compiler paths.
  const target = join(root, '.tmp', `fixture-${process.pid}-${++count}`);
  cpSync(join(root, 'examples/fieldwork'), target, { recursive: true, filter: path => !path.includes('/.design') && !path.includes('/.preview') });
  fixtures.push(target);
  const file = join(target, 'design.config.json');
  return { target, file, project: () => loadProject(file) };
}
const fixtures: string[] = [];
afterAll(() => fixtures.forEach(path => rmSync(path, { recursive: true, force: true })));
function editJSON(path: string, mutate: (value: any) => void) {
  const data = JSON.parse(readFileSync(path, 'utf8')); mutate(data); writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}
function cli(file: string, ...args: string[]) {
  const result = spawnSync(process.execPath, ['src/cli.ts', '--config', file, ...args, '--json'], { cwd: root, encoding: 'utf8', timeout: 30000 });
  expect(result.error).toBeUndefined();
  return { code: result.status, json: JSON.parse(result.stdout), stderr: result.stderr };
}

test('real export lookup, union alternatives, flow, and actual consumer compilation', () => {
  const f = fixture(); const project = f.project(); const catalog = build(project);
  const date = lookup(project, catalog, 'DateRangePicker');
  expect(date.importStatement).toBe("import { DateRangePicker } from '@harness-demo/fieldwork';");
  expect(date.guidance?.review.status).toBe('draft');
  expect(search(project, catalog, 'calendar dates').some(c => c.id.endsWith('#DateRangePicker'))).toBe(true);
  const notice = lookup(project, catalog, 'Notice');
  expect(notice.contract.status).toBe('supported');
  if (notice.contract.status === 'supported') {
    expect(notice.contract.variants).toHaveLength(2);
    const error = notice.contract.variants.find(v => v.props.find(p => p.name === 'tone')?.type === '"error"')!;
    const success = notice.contract.variants.find(v => v.props.find(p => p.name === 'tone')?.type === '"success"')!;
    expect(error.props.find(p => p.name === 'retry')?.required).toBe(true);
    expect(success.props.find(p => p.name === 'retry')).toBeUndefined();
  }
  const checked = cli(f.file, 'check');
  expect(checked.code).toBe(0); expect(checked.json.data.checks).toHaveLength(1);
  expect(checked.json.data.checks[0].status).toBe('passed');
  expect(cli(f.file, 'flows', 'lookup', 'reservation').json.data.states).toContain('failed');
});

test('two builds are byte-identical and preserve authored guidance', () => {
  const f = fixture(); const project = f.project();
  const before = readFileSync(join(f.target, 'guidance.json'), 'utf8');
  build(project); const first = readFileSync(project.output, 'utf8');
  build(project); expect(readFileSync(project.output, 'utf8')).toBe(first);
  expect(readFileSync(join(f.target, 'guidance.json'), 'utf8')).toBe(before);
});

test('uncommitted required prop invalidates lookup, rebuild exposes API and old consumer fails', () => {
  const f = fixture(); build(f.project());
  const source = join(f.target, 'src/components.tsx');
  writeFileSync(source, readFileSync(source, 'utf8').replace('type DateRangeProps = {', 'type DateRangeProps = {\n  locale: string;'));
  const stale = cli(f.file, 'docs', 'lookup', 'DateRangePicker');
  expect(stale.code).toBe(1); expect(stale.json.error.code).toBe('STALE_CATALOG'); expect(stale.json.data).toBeUndefined();
  build(f.project());
  const updated = cli(f.file, 'docs', 'lookup', 'DateRangePicker');
  expect(updated.json.data.contract.variants[0].props.find((p: any) => p.name === 'locale').required).toBe(true);
  const failed = cli(f.file, 'check');
  expect(failed.code).toBe(1); expect(failed.json.data.checks[0].status).toBe('failed');
  expect(failed.json.data.checks[0].stdout).toContain('locale');
  const consumer = join(f.target, 'consumer/Reservation.tsx');
  writeFileSync(consumer, readFileSync(consumer, 'utf8').replace('id="stay"', 'id="stay" locale="en"'));
  build(f.project()); expect(cli(f.file, 'check').code).toBe(0);
});

test('unknown and generic contracts return explicit errors and no invented component', () => {
  const f = fixture(); build(f.project());
  const missing = cli(f.file, 'docs', 'lookup', 'ImaginaryCalendar');
  expect(missing.code).toBe(1); expect(missing.json.error.code).toBe('NOT_FOUND');
  const generic = cli(f.file, 'docs', 'lookup', 'ExperimentalList');
  expect(generic.code).toBe(1); expect(generic.json.error.code).toBe('UNSUPPORTED_CONTRACT');
});

test('ambiguous names require an explicit public ID', () => {
  const f = fixture();
  editJSON(join(f.target, 'package.json'), p => { p.exports['./alt'] = './src/index.ts'; });
  editJSON(f.file, c => { c.entries.push({ file: 'src/index.ts', importPath: '@harness-demo/fieldwork/alt', names: ['DateRangePicker'] }); });
  build(f.project());
  const result = cli(f.file, 'docs', 'lookup', 'DateRangePicker');
  expect(result.code).toBe(1); expect(result.json.error.code).toBe('AMBIGUOUS');
  expect(cli(f.file, 'docs', 'lookup', '@harness-demo/fieldwork/alt#DateRangePicker').code).toBe(0);
});

test('declared import must resolve from the consumer to the indexed entry', () => {
  const f = fixture();
  editJSON(f.file, c => { c.entries[0].importPath = 'react'; });
  writeFileSync(join(f.target, 'guidance.json'), '[]'); writeFileSync(join(f.target, 'flows.json'), '[]');
  const result = cli(f.file, 'build');
  expect(result.code).toBe(1); expect(result.json.error.code).toBe('IMPORT_MISMATCH');
});

test('empty checks and failed commands never produce a green result; queries never execute commands', () => {
  const f = fixture();
  editJSON(f.file, c => { c.checks = []; }); build(f.project());
  const empty = cli(f.file, 'check'); expect(empty.code).toBe(1); expect(empty.json.data.status).toBe('not-configured');
  editJSON(f.file, c => { c.checks = [{ name: 'negative-control', scope: 'Deliberate failure',
    argv: ['bun', '-e', "require('fs').writeFileSync('executed.txt', 'yes'); process.exit(7)"], timeoutMs: 1000 }]; });
  build(f.project());
  const bytes = readFileSync(f.project().output, 'utf8');
  expect(cli(f.file, 'docs', 'lookup', 'Button').code).toBe(0);
  expect(cli(f.file, 'docs', 'search', 'Button').code).toBe(0);
  expect(existsSync(join(f.target, 'executed.txt'))).toBe(false);
  expect(readFileSync(f.project().output, 'utf8')).toBe(bytes);
  const failed = cli(f.file, 'check'); expect(failed.code).toBe(1);
  expect(failed.json.data.checks[0].exitCode).toBe(7); expect(existsSync(join(f.target, 'executed.txt'))).toBe(true);
});

test('approved guidance becomes needs-review when the extracted contract changes', () => {
  const f = fixture(); const initial = build(f.project());
  const component = initial.components.find(c => c.name === 'DateRangePicker')!;
  editJSON(join(f.target, 'guidance.json'), gs => { gs[1].review = { status: 'approved', by: 'test fixture', date: '2026-11-11', contractHash: component.contractHash }; });
  build(f.project()); expect(lookup(f.project(), current(f.project()), 'DateRangePicker').guidance?.review.status).toBe('approved');
  const source = join(f.target, 'src/components.tsx');
  writeFileSync(source, readFileSync(source, 'utf8').replace('type DateRangeProps = {', 'type DateRangeProps = {\n  locale?: string;'));
  build(f.project()); expect(lookup(f.project(), current(f.project()), 'DateRangePicker').guidance?.review.status).toBe('needs-review');
});

test('strict configuration and new source files fail safely', () => {
  const f = fixture(); build(f.project());
  writeFileSync(join(f.target, 'src/new.ts'), 'export const value = 1;');
  expect(cli(f.file, 'docs', 'lookup', 'Button').json.error.code).toBe('STALE_CATALOG');
  editJSON(f.file, c => { c.silentRebuild = true; });
  expect(cli(f.file, 'build').json.error.code).toBe('INVALID_INPUT');
});
