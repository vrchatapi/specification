import type { Oas3Rule } from "@redocly/openapi-core";

type Schema = Record<string, unknown>;

const nameOf = (reference: string) => reference.split("/").at(-1)!.replace(/\.yaml$/, "");
const quote = (values: Iterable<string>) => [...values].map((value) => `\`${value}\``).join(", ");

/**
 * A discriminated union names its members four times: in `oneOf`, as `mapping`
 * targets, as each member's discriminating `const`, and in the `not.enum` of
 * the `defaultMapping` fallback. Reports where those lists disagree, and a
 * fallback listed anywhere but last, where a serde untagged variant must sit.
 *
 * https://spec.openapis.org/oas/v3.2.0.html#discriminator-object
 * https://serde.rs/variant-attrs.html#untagged
 */
export const consistentDiscriminator: Oas3Rule = () => ({
	Schema: {
		enter: (schema, { report, location, resolve }) => {
			const discriminator = schema.discriminator as { propertyName?: string; mapping?: Record<string, string>; defaultMapping?: string } | undefined;
			const members = (schema.oneOf ?? schema.anyOf) as Array<{ $ref?: string }> | undefined;
			if (!discriminator?.propertyName || !discriminator.mapping || !Array.isArray(members)) return;

			const property = discriminator.propertyName;
			const target = (reference: string) => resolve<Schema>({ $ref: reference }).node;
			const fallback = discriminator.defaultMapping ? target(discriminator.defaultMapping) : undefined;

			const constOf = (node: Schema | undefined): unknown => {
				if (!node) return undefined;
				const own = (node.properties as Record<string, Schema> | undefined)?.[property];
				if (own && "const" in own) return own.const;
				for (const part of (node.allOf ?? []) as Array<Schema>) {
					const found = constOf(resolve<Schema>(part).node);
					if (found !== undefined) return found;
				}
				return undefined;
			};

			const listed = new Map(members.filter((item) => item.$ref).map((item) => [resolve<Schema>(item).node, nameOf(item.$ref!)]));
			const mapped = new Map<Schema | undefined, string>();

			for (const [value, reference] of Object.entries(discriminator.mapping)) {
				const node = target(reference);
				const name = nameOf(reference);
				mapped.set(node, value);

				if (!listed.has(node)) {
					report({ message: `\`mapping\` names \`${name}\`, which is not in \`oneOf\`.`, location: location.child(["discriminator", "mapping", value]) });
					continue;
				}

				const declared = constOf(node);
				if (declared === undefined) report({ message: `\`${name}\` is mapped from \`${value}\` but declares no \`const\` for \`${property}\`.`, location: location.child(["discriminator", "mapping", value]) });
				else if (declared !== value) report({ message: `\`${name}\` is mapped from \`${value}\` but its \`${property}\` is \`${String(declared)}\`.`, location: location.child(["discriminator", "mapping", value]) });
			}

			for (const [node, name] of listed)
				if (node !== fallback && !mapped.has(node))
					report({ message: `\`${name}\` is in \`oneOf\` but \`mapping\` does not name it.`, location: location.child(["discriminator", "mapping"]) });

			if (!fallback) return;

			const last = members.at(-1);
			if (!last?.$ref || resolve<Schema>(last).node !== fallback)
				report({
					message: `\`${nameOf(discriminator.defaultMapping!)}\` is the \`defaultMapping\` fallback, so it must be the last member of \`oneOf\`.`,
					location: location.child([schema.oneOf ? "oneOf" : "anyOf"])
				});

			const excluded = (((fallback.properties as Record<string, Schema> | undefined)?.[property]?.not as Schema | undefined)?.enum ?? []) as Array<string>;
			const values = Object.keys(discriminator.mapping);
			const missing = values.filter((value) => !excluded.includes(value));
			const extra = excluded.filter((value) => !values.includes(value));
			if (missing.length === 0 && extra.length === 0) return;

			const parts = [missing.length > 0 && `missing ${quote(missing)}`, extra.length > 0 && `extra ${quote(extra)}`].filter(Boolean);
			report({ message: `\`${nameOf(discriminator.defaultMapping!)}\` must exclude exactly the mapped values: ${parts.join(", ")}.`, location: location.child(["discriminator", "defaultMapping"]) });
		}
	}
});
