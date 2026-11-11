# Sources, credits, and evidence boundaries

This is an independent Netkreatives implementation. It is not Stripe software, an extraction of Sail, or endorsed by Stripe or the writers below. Original code and instructional prose were created for this repository. No talk screenshots, proprietary component code, or full transcripts are redistributed.

## The central inspiration

**Katie Dill / Stripe**, [How to scale intent, quality, and artistry with AI](https://www.youtube.com/watch?v=GLvFTMtw4Jk), published by Lenny's Podcast. The owner supplied a transcript and two screenshots from the talk. We credit Dill's emphasis on a clear point of view, encoding standards into production tools, editorial responsibility, and creative exploration.

The screenshots show `pay sail docs lookup DateRangePicker --json` returning component metadata, an import/package, subcomponents, and typed props. They show an internal documentation URL and `@sail/ui`. They establish a demonstrated query shape, **not** the underlying source code, extraction algorithm, schema guarantees, or installation procedure.

The supplied transcript describes moving from a documentation MCP approach to a CLI and incorporating templates and flows. Our architecture is a practical proposal informed by that account. A bounded search did not locate public source or an installation package for this internal Sail CLI. That is not proof that none exists. Do not confuse it with the public [Stripe CLI documentation commands](https://docs.stripe.com/cli/docs) or [Stripe Apps UI components](https://docs.stripe.com/stripe-apps/components).

## Additional primary sources

| Source | What informed this project | Boundary |
| --- | --- | --- |
| **Atlassian Design System team**, [Giving AI agents design system context from the terminal](https://www.atlassian.com/blog/ai-at-work/giving-ai-agents-design-system-context-from-the-terminal-what-we-learned-building-a-cli) | Structured source content, focused command access, and evaluating actual agent work | Their results are not benchmarks for this repo; no source code copied |
| **Storybook maintainers**, [Manifests](https://storybook.js.org/docs/ai/manifests) | A potential existing source of component/docs metadata | Their schema is marked preview; this version does not implement that adapter |
| **Microsoft / TypeScript contributors**, [Using the Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) | Programs, symbols, public exports and type inspection | This repo uses a pinned compiler and a deliberately bounded extractor |
| **Owen Williams and Claire Vo**, [Stripe's internal prototyping studio interview](https://www.chatprd.ai/how-i-ai/stripe-owen-williams-on-buildling-internal-prototyping-studio) | Grounding prototypes in real components, app context and human iteration | ProtoDash's implementation is not assumed to be Sail's |
| **Cristian Rivera and Sai Samant / Stripe**, [Harbor: Stripe's AI-assisted prototyping tool](https://stripe.dev/blog/harbor-stripes-ai-assisted-prototyping-tool) | The importance of rendering and inspecting working interfaces | Harbor is separate evidence; no claim it shares Sail internals |
| **Nabeel Qureshi**, [What makes art great?](https://nabeelqu.substack.com/p/what-makes-art-great) | Intentional detail and coherence as editorial concerns | Not an automated quality metric |
| **GOV.UK Design System contributors**, [Patterns](https://design-system.service.gov.uk/patterns/) | Treating a task/flow as more than isolated components | No GOV.UK assets, patterns or endorsement are implied |

Research began November 10, 2026; implementation assembled November 11, 2026. Links may evolve. The talk evidence came from user-supplied material; additional sources were publicly inspected during research. Claims about our behavior belong in executable tests and [acceptance evidence](acceptance/README.md), not in borrowed authority.

## Software credits

The implementation depends on TypeScript, Zod, React, React DOM and Bun. Test-only DOM behavior uses Happy DOM and community type definitions. Dependencies retain their own licenses; versions are recorded in package.json and bun.lock. The MIT license in this repository covers our original work, not third-party linked media or trademarks.
