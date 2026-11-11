# Acceptance evidence — initial reference

Executed locally on November 11, 2026 with Bun 1.3.6 and the committed dependency lock. This is implementation evidence, not a claim of production adoption or a comparative model benchmark.

## Automated verification

`bun install --frozen-lockfile` completed with no dependency changes.

`bun run verify` completed successfully:

- TypeScript type checking: passed.
- Bun tests: **10 passed, 0 failed, 72 assertions**, across two test files.
- Browser bundle: generated Fieldwork JavaScript and CSS successfully.

The tests exercised actual consumer compilation; union alternatives; byte-identical rebuilds; preservation of authored guidance; uncommitted required-prop drift; an outdated consumer failing followed by a repaired consumer passing; missing, ambiguous and unsupported components; public-import mismatches; empty/failing checks; read-only lookup; changed approval status; and strict input validation.

The DOM interaction test exercised empty/invalid date rejection, a failed request, retry with dates retained, disabled submission while pending, duplicate-submit prevention, and confirmed output. It uses Happy DOM, not a real browser or a screen reader. Browser bundling does not establish visual or accessibility approval.

Initial runs hit Bun's default five-second per-test limit for multi-compiler cases. The verification command was corrected to use the explicit 60-second per-case test script; the complete rerun passed. This does not relax assertions or convert unexecuted checks into success.

## Agent transfer exercise

See [the recorded transfer](transfer.md). A separate agent read BUILD.md, inspected the second purpose-built design system, created its configuration and draft guidance, and ran the reference CLI against it. The target uses aliased exports and different prop alternatives.

This establishes a **configuration adaptation** of the supplied runtime to a second small target. It does not prove an independently installed CLI, arbitrary framework support, real-world repository generalization, or a speed/quality improvement over another workflow. That broader benchmark has not been run.

## Reproduce

```bash
bun install --frozen-lockfile
bun run verify
bun run design --config examples/fieldwork/design.config.json build
bun run design --config examples/fieldwork/design.config.json check
bun run design --config examples/switchyard/design.config.json build
bun run design --config examples/switchyard/design.config.json check
```

Generated catalogs remain ignored and local because fingerprints include the local dependency graph. Rebuild them on each checkout. GitHub Actions runs the verification and both consumer checks; consult the actual workflow run for remote status rather than assuming local success means CI passed.

## Explicitly outside this evidence

- Stripe Sail implementation equivalence or compatibility with Stripe's private components.
- A native binary, MCP/Figma integration, Flutter/Dart extraction, or a generic Storybook adapter.
- Human editorial approval, real booking/payment behavior, real-browser visual QA, screen-reader coverage, or comprehensive accessibility compliance.
- An isolated security boundary. The repo's configuration and configured commands are trusted local code.
