# Working on this harness

Read README.md for scope and BUILD.md for adapting this project to another design system.

- Run `bun install --frozen-lockfile`, then `bun run verify`. For tests alone, use `bun run test` (explicit per-case timeout).
- Keep generated catalogs and scratch work in ignored `.design/` and `.tmp/` directories.
- Lookup/search must be read-only: no install, rebuild, shell execution, or network calls.
- Never infer props or public imports from prose. Extract them from the TypeScript program.
- Preserve authored guidance; API facts, editorial review, and executed checks are separate records.
- Test negative outcomes as well as successful lookup. A stale catalog must fail before returning component data.
- Add support for another framework only with its real parser and a consumer validation path.
- Treat project configuration and source as trusted local code. This tool is not a sandbox.
- Do not claim compatibility, accessibility, visual quality, or agent performance without evidence for the specific claim.
