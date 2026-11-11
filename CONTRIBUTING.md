# Contributing

Start with one reproducible case the current harness cannot handle. Include a tiny public component, its actual consumer import, expected lookup output, and a check that fails with an incorrect result.

Install with `bun install --frozen-lockfile`; run `bun run verify`. Keep tests inside the repository and scratch fixtures under `.tmp/`. Do not edit the live example to simulate a failure without restoring it.

Preserve the distinction between source facts, authored intent, and verification. An extractor must fail explicitly when it cannot represent an API. New adapters need a real consumer check and a documented support boundary. Keep search and lookup read-only.

When proposing a workflow change, show whether an agent can apply the recipe to another target. A command transcript is useful evidence; invented transcripts and unsupported speed/quality claims are not.

Contributions are under this repository's MIT license. Credit source ideas and respect the licenses of any reused code or assets.
