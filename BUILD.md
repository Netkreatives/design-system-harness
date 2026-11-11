# Build a design-system harness for a target project

You are adapting a working reference, not installing a universal style authority. Your deliverable is a CLI that tells an agent how to use the target's actual components and how to check its implementation.

## 1. Establish the target and the contract

Read its repository instructions, package manifests, public exports, TypeScript config, stories/examples, and existing checks. Inspect the worktree before changing anything. Follow the owner's approval rules.

Record these in a short target-owned integration note:

- What package or source entry the consumer imports, and the version/source it actually resolves.
- Which components are needed for one real task; start with two or three.
- Which source of guidance is approved, draft, or missing, and who owns it.
- The exact consumer command that will catch a wrong import or required prop.
- A bounded runtime/user-journey check for the selected flow.

If no reusable components exist, say so. Propose that prerequisite separately instead of manufacturing an authoritative catalog from screenshots. If the project already has a working design CLI, use it and improve its missing contract rather than duplicating it.

## 2. Choose a small integration

Use this reference directly when the target is compatible React/TypeScript. Place the harness beside the target's tooling using its normal package manager. Keep the CLI locally installed; avoid invoking a package download for every query.

For a self-contained integration, copy `src/model.ts`, `src/catalog.ts`, and `src/cli.ts` into a small harness package, retain the license, and install the pinned TypeScript/Zod dependencies using the target's package-manager convention. The reference fingerprints its own source, package.json and bun.lock; **adapt that explicit list when using another layout or lockfile.** Do not change the public JSON contract without versioning it.

For a first proof, you can invoke this repository's CLI with an absolute target config path without copying it. Be explicit that this still depends on this checkout. A production adoption should have a documented target-owned invocation.

If adapting to another language, use its compiler/parser. Do not infer APIs with regex or translate TypeScript extraction assumptions into Dart. A future Rust query runtime may consume a versioned catalog, but is not needed to prove this workflow.

## 3. Configure authoritative extraction

Create a `design.config.json` **inside the design-system package or target root**. All relative paths and check commands are anchored to that directory. Start from [the Fieldwork config](examples/fieldwork/design.config.json).

Fill in:

- `id`: a stable name for this system.
- `tsconfig`: a valid config for the component source. Keep consumer examples in a separate checking config so an outdated example can fail after an API rebuild.
- `consumer`: a real `.tsx` file whose imports establish the consumer resolution context.
- `entries`: actual public entry files, consumer import specifiers, and selected exported names. Names must come from the code, not documentation guesses.
- `inputs`: source folders, consumer folders, configuration, styles/tokens, and other files whose changes should invalidate the catalog. Include custom/extended compiler configs and installed package manifests affecting resolution when they are not covered automatically. See [fingerprint boundaries](guides/contracts.md).
- `guidance` and `flows`: paths to JSON arrays; start with `[]` if no guidance exists.
- `checks`: existing commands as argument arrays, with a name, an accurate scope, and a timeout. An empty list produces `not-configured`, never success.

The reference checks that the import resolves from the consumer to the indexed entry. If your public import resolves to a separate declaration build, index that declaration entry and rebuild it explicitly; do not silently point extraction at different source. Do not invent a path alias to hide a package mismatch.

Run `build`. Investigate diagnostics. A component with an unsupported contract remains discoverable in search, but lookup fails with its source and reason. Narrow the initial scope or implement and test a real adapter; never replace a failed extraction with inferred props.

## 4. Attach intent and one complete flow

Write guidance alongside source, separately from generated facts. Use stable IDs of the form `import-path#ExportName`. Explain when to use the component, what it achieves for this product, and what to avoid. Link a real example file in the consumer, not a detached snippet with imaginary imports.

Keep new guidance `draft`. An owner can approve it by recording `status: approved`, `by`, `date`, and the component's current `contractHash`. After a changed API is rebuilt, a mismatched approval becomes `needs-review` in lookup. Do not approve your own invented design direction on behalf of the owner. Flow records in v1 are drafts and make no approval claim.

Encode one end-to-end flow: goal, components, steps, all meaningful states, and an actual implementation. Include failure/retry, empty input, and loading behavior where relevant. State what real user need motivates each choice. Do not make every project look like the example brand.

## 5. Make the CLI part of agent work

Propose a short addition to the target's agent instructions:

> Before changing UI in this system, search the project design CLI, then look up the chosen components and relevant flow. Use the returned public imports and preserve prop relationships. On stale data, rebuild explicitly. On missing or unsupported APIs, inspect the source and report the gap instead of inventing a substitute. Run the configured checks and exercise the changed flow. Report technical evidence and editorial review separately.

Document the exact local command and config path. JSON belongs on stdout, diagnostics on stderr, and all failed operations need a nonzero exit. Queries must not execute source code or configured checks.

## 6. Prove it works

Use a disposable copy/worktree inside the target's approved ignored scratch location. Never mutate a user's active component merely to demonstrate failure.

1. Build the catalog and look up a real component. Compile its example through the public consumer import.
2. Search and retrieve a flow. Use it to implement or adapt a small consumer task. Save the relevant command/result trace.
3. Add a required prop without committing. Lookup must fail as stale. Rebuild, confirm the new prop appears, and confirm the old consumer example fails. Update the example and rerun the affected check.
4. Test unknown names and ambiguous names. Use full IDs to disambiguate. Test a genuinely unsupported contract.
5. Build twice without input changes and compare catalog bytes. Authored guidance must remain byte-for-byte unchanged.
6. Verify check failure produces a nonzero exit, empty checks remain unconfigured, and lookup runs no commands.
7. Restore the disposable mutation. Review one real user journey; list what was not checked.

The recipe itself also needs a transfer test: an agent adapts it to a second small system with different exports and a contract complication. It must discover the component answers from the target. This repository records that exercise in [acceptance](acceptance/README.md); it is one example, not proof of universal compatibility or a model benchmark.

## Deliver

Provide the target-owned command, changed files, exact checks/results, an example lookup, the adaptation trace, and limitations. Leave a narrow next task if an unsupported API needs an adapter. Do not describe passing types as human design approval or a tested command as a deployed product.
