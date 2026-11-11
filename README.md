# Design System Harness

**Teach your coding agent to build a CLI around your real design system.**

An executable reference, an adaptation recipe, and checks that connect component documentation to actual source code. Inspired by Katie Dill's demonstration of Stripe's internal Sail CLI; independently implemented by Netkreatives. [Sources and credits](SOURCES.md).

```text
Your exports + TypeScript types     Your authored intent + example flows
                  \                  /
                   validated catalog
                           |
                 focused CLI lookup
                           |
                 agent builds a flow
                           |
                 real consumer checks
```

The useful question is not “can the model draw a button?” It is “can it use **our** button, with the correct API, in a flow that follows **our** standards?”

## Try the working reference

Prerequisite: [Bun](https://bun.sh/docs/installation). This repository pins Bun 1.3.6 and TypeScript 5.9.3; use the committed lockfile.

```bash
git clone https://github.com/Netkreatives/design-system-harness.git
cd design-system-harness
bun install --frozen-lockfile

bun run design --config examples/fieldwork/design.config.json build
bun run design --config examples/fieldwork/design.config.json docs search "dates" --json
bun run design --config examples/fieldwork/design.config.json docs lookup DateRangePicker --json
bun run design --config examples/fieldwork/design.config.json flows lookup reservation --json
bun run design --config examples/fieldwork/design.config.json check
```

Lookup returns the real import, typed props, source location, contract fingerprint, authored guidance, its review status, and the source of a consumer example. Facts come from the compiler, not model-generated documentation. Search returns a compact list and the arguments for the next lookup.

Try `docs lookup Notice` to see a discriminated union: an error requires `retry`; success does not. Try `docs lookup ExperimentalList` to see an explicit unsupported generic contract. Unknown names fail instead of selecting a substitute.

## Point an agent at this repo

Copy this into your coding agent, with access to this repository and your target:

> Read BUILD.md in Netkreatives/design-system-harness. Inspect my project's existing design system and propose the smallest project-specific CLI integration. Preserve our components, package manager, and checks. Once approved, implement it, demonstrate a real consumer flow, and prove that an uncommitted API change invalidates stale documentation. Do not invent components or claim human design approval.

[BUILD.md](BUILD.md) is the actual build recipe. It explains where authoritative APIs come from, how to configure or adapt extraction, how to attach intent, and how to verify the resulting harness.

## What is included

| Part | Purpose |
| --- | --- |
| [Agent build recipe](BUILD.md) | Build or adapt a project-specific CLI against another codebase |
| [Reference CLI](src/cli.ts) | `build`, `docs search`, `docs lookup`, `flows lookup`, `check` |
| [Compiler extraction and catalog](src/catalog.ts) | Public export resolution, contract extraction, freshness checks |
| [Runtime-validated contracts](src/model.ts) | Strict configuration, guidance, flow, and catalog schemas |
| [Fieldwork example](examples/fieldwork) | Cabin reservation flow, recovery states, real package imports |
| [Behavioral tests](tests) | Success and failure cases, stale data, consumer incompatibility |
| [Acceptance evidence](acceptance/README.md) | What was executed, and what remains outside the evidence |

## See the example

```bash
bun run demo:build
python3 -m http.server 4173 --directory examples/fieldwork
# Open http://localhost:4173
```

The browser preview simulates reservation confirmation. It never books or charges anything. The flow uses explicit editing, submitting, failed, and confirmed states; the tests exercise recovery as well as success. Its brand guidance is an illustrative draft, not a claim of human approval.

## Guarantees and boundaries

- **Read-only queries.** Search and lookup do not rebuild, install, execute checks, or make network requests.
- **Fail on stale inputs.** Source contents, dependency source files, manifests/locks, configured inputs, and extractor files contribute to the fingerprint, including uncommitted changes. See [the contract](guides/contracts.md) for scope.
- **Public imports must resolve.** Extraction verifies that the declared import resolves from the consumer to the indexed entry point.
- **Separate kinds of evidence.** Fresh catalog data is not a passing compiler check. A passing check is not good taste, usability, or comprehensive accessibility.
- **Configured commands are trusted code.** `check` runs only the commands in the project config, without shell interpolation, with bounded execution. Inspect a config before running it. This is not a sandbox.

Version 0.1 supports explicitly selected React-style functions with a single non-generic object props parameter, including object unions and re-exported names. Generic components, overloads, index-signature props, and unconstrained props fail explicitly. This is not a universal React API extractor. Storybook manifests and other languages require adapters with their own tests.

No LLM API key, hosted service, embeddings, Figma integration, or MCP server is required. No Rust binary or Dart adapter is included. The example compiles with the pinned dependencies; compatibility with an arbitrary existing project must be checked there.

## Develop

```bash
bun run verify
```

See [CONTRIBUTING.md](CONTRIBUTING.md). Original code and writing are [MIT licensed](LICENSE); linked third-party material remains under its owners' terms.
