# Agent transfer acceptance: Switchyard

Executed 2026-11-11 with Bun 1.3.6 and the repository's pinned TypeScript 5.9.3. This was **one agent run against a small, purpose-built second system**, not a blind production benchmark, independent design review, or compatibility survey.

## Scope and discovery

The agent received the target path and adaptation task, but no component API answers. It read `AGENTS.md`, `BUILD.md`, package exports, compiler configs, source and the existing consumer. It discovered:

- `@harness-demo/switchyard` version `0.0.0` exports `src/public.ts`.
- Public `Action` aliases implementation `ActionControl`; public `Status` aliases `JobStatus`.
- `Action` has two object-union branches: link requires `href`, command requires `onActivate`; both require `kind` and `text`.
- `Status` requires `detail` and a phase of `idle`, `working`, or `complete`.
- The existing restart consumer models `idle`, `working`, `failed`, and `complete`; failure uses an alert rather than an unsupported Status phase.

Added only `examples/switchyard/{design.config.json,guidance.json,flows.json,README.md}` and this report. Existing components and consumer were not changed. New guidance and flow remain **draft**. This is **config-only reuse of the reference runtime in this checkout**, not a standalone installed package or an extraction adapter written by the transfer agent.

## Public target commands

Run from the repository root after the documented dependency installation:

```sh
bun run design --config examples/switchyard/design.config.json build
bun run design --config examples/switchyard/design.config.json docs search command --json
bun run design --config examples/switchyard/design.config.json docs lookup Action --json
bun run design --config examples/switchyard/design.config.json docs lookup Status --json
bun run design --config examples/switchyard/design.config.json flows lookup restart-worker --json
bun run design --config examples/switchyard/design.config.json check
```

All six commands exited 0. Search returned the public Action ID and a full-ID lookup command. Lookup returned public import statements, the original implementation source locations, both Action union branches and draft guidance. Flow lookup returned the existing restart implementation. The configured check executed `bun ../../node_modules/typescript/bin/tsc --project tsconfig.consumer.json --noEmit` from the example directory and passed.

After the coordinator completed the final package verification-script edit, the original target was explicitly rebuilt and checked again. Both exited 0 with fingerprint `454c5d6451b39c484c59a06589edaf58c20f3e2c8eb3a578d9f4148e6410eee0`.

Example extracted import: `import { Action } from '@harness-demo/switchyard';`. The internal `ActionControl` name is not substituted for the public export.

## Isolated required-prop experiment

A Python driver copied the target into ignored `.tmp/transfer/agent-run-20261111/switchyard`, excluding `.design`. It invoked the repository CLI with that copy's config, without copying CLI source or creating a new installed harness. The scratch check path was adjusted to `../../../../node_modules/typescript/bin/tsc` because its directory was two levels deeper. The disposable copy included local dependency contents; see the runtime-fixture issue below.

For each row, the command was `bun run design --config .tmp/transfer/agent-run-20261111/switchyard/design.config.json <arguments>`:

| Step | Arguments / operation | Observed result |
| --- | --- | --- |
| Baseline | `build`, then `check` | Both exit 0; consumer compiles |
| Repeat build | `build` without changes | Exit 0; catalog bytes exactly equal |
| Wrong internal name | `docs lookup ActionControl` | Exit 1, `NOT_FOUND` |
| Required prop mutation | Add `operationId: string` to JobStatus's props type | Scratch source only |
| Refuse stale data | `docs lookup Status` | Exit 1, `STALE_CATALOG`; no component data |
| Refresh contract | `build`, then `docs lookup Status` | Both exit 0; `operationId` appears with `required: true` |
| Old consumer | `check` | Exit 1; TypeScript TS2741 reports missing `operationId` |
| Repair consumer | Change `<Status phase=` to `<Status operationId="restart-worker" phase=` | Scratch consumer only |
| Validate repair | `build`, then `check` | Both exit 0 |
| Restore original scratch source and consumer | `build`, then `check` | Both exit 0 |

The driver asserted the new prop's name and required flag, checked the missing-prop diagnostic, compared catalog bytes, and compared `guidance.json` bytes before and after. Authored guidance was unchanged. The two identical catalog files had SHA-256 `903ba486913078c9eecfa30a0356d0c8f5caf3b92596bd7193ee00b3adb950b8` in that scratch environment; this is execution evidence, not a portable golden hash.

One earlier attempt stopped between baseline build and check with `STALE_CATALOG`. The coordinator had concurrently changed the reference extractor's signature formatting and package test script. Those runtime/config changes are fingerprint inputs. The agent explicitly rebuilt and reran the sequence after coordination; the earlier failure was not attributed to target API drift.

## Simulated journey

A temporary Happy DOM driver rendered the unchanged existing consumer using React `act`, injected a manually resolved/rejected restart promise, and asserted readiness, loading text, command absence while pending, retained guidance link, failure alert, retry label, exactly two calls after retry, completion text, and removal of the failure alert. Executed command:

```sh
bun .tmp/transfer/agent-run-20261111/journey.ts
```

Result: exit 0, `PASS: idle -> working -> failed -> working -> complete; command hidden pending; guidance link retained`.

The first journey attempt imported the copied consumer and failed with an invalid hook call: copying the example's dependency symlink contents had created a second React instance. The driver was corrected to import the unchanged original consumer, sharing the root React runtime, and then passed. This was a temporary fixture setup failure; no production component was changed. The mutation/repair type checks above ran against the scratch consumer. The runtime journey ran against the original consumer. After recording the results, the agent removed its own temporary driver, raw outputs, and scratch copy. The displayed journey command documents the executed one-time probe; it is not a maintained public test command.

## Limits

The target and initial restart consumer already existed; the agent adapted configuration and repaired the disposable consumer after discovering an API change. It did not build a new production UI from a blank task. No real worker service, browser screenshots, human usability review, visual approval, or comprehensive accessibility testing was performed. The guidance destination is a placeholder. No empty-input behavior exists because this flow has no input field. This transfer did not add ambiguous-name or unsupported-component fixtures; those broader reference-runtime checks are separate from this two-component result. No paid external API was used.
