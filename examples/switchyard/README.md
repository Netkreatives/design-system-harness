# Switchyard transfer example

This small, purpose-built React/TypeScript system provides a worker restart flow. The harness integration is **config-only reuse of this repository's reference runtime**, not a standalone installed package. Run commands from the repository root after `bun install --frozen-lockfile`:

```sh
bun run design --config examples/switchyard/design.config.json build
bun run design --config examples/switchyard/design.config.json docs search command --json
bun run design --config examples/switchyard/design.config.json docs lookup Action --json
bun run design --config examples/switchyard/design.config.json docs lookup Status --json
bun run design --config examples/switchyard/design.config.json flows lookup restart-worker --json
bun run design --config examples/switchyard/design.config.json check
```

The consumer imports `@harness-demo/switchyard` version `0.0.0`, whose package export resolves to `src/public.ts`. That entry renames `ActionControl` to `Action` and `JobStatus` to `Status`. Use the public names returned by lookup. `Action` preserves a discriminated union: `kind="link"` requires `href`; `kind="command"` requires `onActivate`. Both require `text`.

`consumer/Restart.tsx` is the existing implementation. Its explicit states are `idle`, `working`, `failed`, and `complete`. It hides the restart command while awaiting a promise, offers retry after rejection, and reports completion after resolution. `Status` accepts only `idle`, `working`, and `complete`; failure uses an alert. There is no input field or empty-input state. The guidance URL is an example placeholder; the promise is supplied by the caller and no backend integration is provided.

`guidance.json` and `flows.json` are agent-authored **drafts**, maintained with this example. No owner has approved the product direction. `check` runs the actual TypeScript consumer command from this example directory; it does not exercise a real worker or approve the visual design. See [the transfer evidence](../../acceptance/transfer.md) for the separately executed simulated journey and required-prop mutation.
