# Contracts and failure behavior

## Inputs and extraction

`src/model.ts` is the schema authority. Unknown JSON keys fail validation. Config, guidance, flows and catalogs are parsed at disk boundaries. The TypeScript compiler program resolves aliases and extracts selected exports. This implementation pins compiler 5.9.3 because compiler APIs require compatibility testing on upgrades.

Supported contracts contain a complete displayed call signature and a list of alternatives. Each alternative retains its property types and required flags. For a discriminated union, **choose one whole alternative**; do not combine all props into a bag of independent options. Nested types remain TypeScript type expressions, not a recursively expanded schema. Read referenced source types when necessary.

Unsupported includes generics, multiple signatures, zero/multiple props parameters, non-object or indexed props, and explicit unconstrained any/unknown props. Wrapper/exotic component compatibility is not claimed; add dedicated cases before widening support. The config explicitly selects components, so the extractor is not an automatic semantic classifier of every exported function.

## Fingerprint scope

Build records compiler source dependencies, including loaded declaration files. Query recomputes content hashes for those files and for the config, consumer, entry points, guidance, flows, linked examples, and `inputs`. Configured directories are enumerated again so additions/removals are detected. `.git`, `node_modules`, `.design`, `.tmp` and `.preview` directories are skipped during that traversal; loaded node_modules declarations are still individually hashed. Source input symlinks are rejected to avoid recursive traversal; compiler-resolved workspace links are allowed.

The extractor's implementation, package manifest and Bun lockfile are included. Ancestor package manifests, lockfiles, and tsconfig.json files are also included. The fingerprint is over file content, never just HEAD. There is no promise that an unlisted file will invalidate the catalog. List custom extended configs, generated style/token outputs, environment-dependent inputs, and dependency manifests explicitly or extend the adapter to track them. Environment variables are not fingerprinted; avoid environment-dependent resolution or treat it as a separate integration requirement.

The reference does not run TypeScript resolution again on every lookup. Install/update dependencies using the lockfile and rebuild afterward. It is designed for a trusted local checkout; editing a generated catalog manually or running against hostile files is outside its integrity model. Catalog paths and dependencies are data, not a sandbox boundary. Output lives at `<config-directory>/.design/catalog.json` and never depends on the caller's output directory.

## CLI protocol

All commands except help return one JSON object. `--json` is accepted explicitly; JSON is also the default. There are no progress banners on stdout. Success includes `schemaVersion`, `ok`, `command`, `system`, `fingerprint`, and `data`. Failure includes `ok: false` and an error `code`, `message`, and optional `details`. Failures exit 1; successful operations exit 0. Scripts should inspect both exit code and `ok`.

Common error codes: `INVALID_INPUT`, `INVALID_PATH`, `MISSING_INPUT`, `SOURCE_INVALID`, `IMPORT_MISMATCH`, `MISSING_EXPORT`, `CATALOG_MISSING`, `STALE_CATALOG`, `NOT_FOUND`, `AMBIGUOUS`, `UNSUPPORTED_CONTRACT` and `USAGE`.

`build` can succeed while reporting explicitly selected unsupported components. That means the catalog was built, not that every component is supported. Looking up an unsupported component fails. Search is case-insensitive AND matching, limited to 20 results; use more specific words to narrow. Lookup accepts a unique case-insensitive name or exact full ID. It never uses fuzzy substitution.

## Checks and review

`check` first requires current catalog data, then invokes the exact configured argv arrays from the config directory. Commands have timeouts and bounded captured output. There is no shell interpolation, but an explicitly configured shell or executable can do anything the user can. Review commands before executing them. No check runs during lookup or search.

Each executed check reports scope, argv, status, exit code/signal, stdout and stderr. Missing configuration is `not-configured` and exits 1. All configured checks must pass. If checks mutate fingerprinted inputs, the overall operation fails as stale; no evidence for the old fingerprint is claimed. Commands should write temporary/build files only under ignored paths.

Guidance approvals bind to a component contract hash, not to an application release. An API change marks the old approval `needs-review`; a reviewer must also assess guidance changes through normal code review. There is no cryptographic approver identity, remote approval service, or comprehensive design-quality score.
