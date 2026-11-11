import { z } from 'zod';

const text = z.string().min(1);
export const Config = z.strictObject({
  schemaVersion: z.literal(1),
  id: text,
  tsconfig: text,
  consumer: text,
  entries: z.array(z.strictObject({ file: text, importPath: text, names: z.array(text).min(1) })).min(1),
  inputs: z.array(text).min(1),
  guidance: text,
  flows: text,
  checks: z.array(z.strictObject({
    name: text, scope: text, argv: z.array(text).min(1),
    timeoutMs: z.number().int().min(100).max(300000),
  })),
});

const Review = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('draft') }),
  z.strictObject({ status: z.literal('approved'), by: text, date: text, contractHash: text }),
]);
export const Guidance = z.array(z.strictObject({
  componentId: text, intent: text, whenToUse: text, avoid: text,
  example: text, review: Review,
}));
export const Flows = z.array(z.strictObject({
  id: text, title: text, components: z.array(text).min(1),
  steps: z.array(text).min(1), states: z.array(text).min(1),
  example: text, status: z.literal('draft'),
}));

const Prop = z.strictObject({ name: text, type: text, required: z.boolean(), description: z.string() });
const Contract = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('supported'), signature: text,
    variants: z.array(z.strictObject({ type: text, props: z.array(Prop) })).min(1),
  }),
  z.strictObject({ status: z.literal('unsupported'), reason: text, signature: z.string() }),
]);
export const Component = z.strictObject({
  id: text, name: text, importPath: text, importStatement: text,
  description: z.string(), source: text, contract: Contract, contractHash: text,
});
export const Catalog = z.strictObject({
  schemaVersion: z.literal(1), system: text, fingerprint: text,
  compilerVersion: text, extractorVersion: z.literal('1'),
  dependencies: z.array(text),
  components: z.array(Component),
});
export type Config = z.infer<typeof Config>;
export type Component = z.infer<typeof Component>;
export type Catalog = z.infer<typeof Catalog>;

export class HarnessError extends Error {
  constructor(public code: string, message: string, public details?: unknown) { super(message); }
}
