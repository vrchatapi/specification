import type { Oas3Rule } from "@redocly/openapi-core";

type Schema = Record<string, unknown>;

interface Shape {
	name: string;
	properties: Set<string>;
	required: Set<string>;
	closed: boolean;
}

const nameOf = (reference: string) => reference.split("/").at(-1)!.replace(/\.yaml$/, "");
const contains = (outer: Set<string>, inner: Set<string>) => [...inner].every((key) => outer.has(key));

// An untagged client takes the first member that fits, so the narrowest must lead.
// https://serde.rs/enum-representations.html#untagged
export const specificUnionMemberFirst: Oas3Rule = () => ({
	Schema: {
		enter: (schema, { report, location, resolve }) => {
			const keyword = schema.oneOf ? "oneOf" : "anyOf";
			const members = schema[keyword] as Array<{ $ref?: string }> | undefined;
			if (!Array.isArray(members) || schema.discriminator) return;

			const collect = (node: Schema | undefined, shape: Shape) => {
				if (!node) return shape;
				for (const key of Object.keys((node.properties as Schema | undefined) ?? {})) shape.properties.add(key);
				for (const key of (node.required as Array<string> | undefined) ?? []) shape.required.add(key);
				if (node.additionalProperties === false) shape.closed = true;
				for (const part of (node.allOf as Array<Schema> | undefined) ?? []) collect(resolve<Schema>(part).node, shape);
				return shape;
			};

			const shapes = members
				.filter((member) => member.$ref)
				.map((member) => collect(resolve<Schema>(member).node, { name: nameOf(member.$ref!), properties: new Set(), required: new Set(), closed: false }))
				.filter((shape) => shape.properties.size > 0);

			shapes.forEach((earlier, index) => {
				for (const later of shapes.slice(index + 1)) {
					if (earlier.closed) continue;
					const extendsEarlier = contains(later.properties, earlier.properties) && contains(later.required, earlier.required);
					const addsMore = later.properties.size > earlier.properties.size || later.required.size > earlier.required.size;
					if (extendsEarlier && addsMore)
						report({ message: `\`${later.name}\` extends \`${earlier.name}\`, so it must come before it.`, location: location.child([keyword]) });
				}
			});
		}
	}
});
