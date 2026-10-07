import type { Oas3Decorator } from "@redocly/openapi-core";

/**
 * Closes every object schema that lists properties, so a response carrying a
 * field the description does not mention fails validation.
 *
 * Only for the test bundle. An open schema legally permits any extra property,
 * which is correct for consumers but makes undocumented fields undetectable.
 *
 * A schema another reaches through `allOf` is left open: the composing schema
 * closes over its properties, and closing the part as well would reject every
 * property the composing schema adds. Where such a schema is also used directly,
 * that reference is closed instead.
 *
 * Schemas without `properties` are left alone — those are deliberately free-form
 * (`defaultContentSettings`, `appleDetails`) and closing them would report their
 * entire contents as drift.
 *
 * `unevaluatedProperties` is a JSON Schema 2019-09 keyword and is not valid in
 * this description's OpenAPI 3.0.3 dialect. It works because `redocly drift`
 * validates with Ajv; a validator that only knows 3.0 ignores it and silently
 * reports zero drift. Safe only while the `test` bundle stays unpublished and
 * drift-only.
 */
export const closeSchemas: Oas3Decorator = () => {
	const candidates: Array<Record<string, unknown>> = [];
	const parts = new WeakSet<object>();
	const partReferences = new WeakSet<object>();
	const references: Array<{ reference: Record<string, unknown>; target: object }> = [];

	return {
		ref: {
			enter: (reference, _, { node }) => {
				if (node) references.push({ reference: reference as unknown as Record<string, unknown>, target: node as object });
			}
		},
		Schema: {
			enter: (schema, { resolve }) => {
				for (const part of (schema.allOf ?? []) as Array<object>) {
					partReferences.add(part);
					const { node } = resolve(part);
					if (node) parts.add(node as object);
				}
			}
		},
		SchemaProperties: {
			leave: (_, { parent }) => {
				if (parent.type !== "object" || parent.additionalProperties !== undefined) return;
				if (parent.unevaluatedProperties !== undefined) return;
				candidates.push(parent);
			}
		},
		Root: {
			leave: () => {
				// `unevaluatedProperties`, not `additionalProperties`: inside a `oneOf`
				// branch the latter judges the whole object, so a response matching one
				// branch fails every other branch once per field. `/auth/user` produced 89
				// phantom findings that way, including for properties the description does
				// define.
				for (const schema of candidates) if (!parts.has(schema)) schema.unevaluatedProperties = false;

				const closable = new WeakSet<object>(candidates);
				for (const { reference, target } of references)
					if (parts.has(target) && closable.has(target) && !partReferences.has(reference)) reference.unevaluatedProperties = false;
			}
		}
	};
};
