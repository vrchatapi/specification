import type { Transform } from "../layer.ts";

/**
 * A `type` naming several types accepts a value of any of them, which is the
 * union `anyOf` spells out one member per type. Written that way, it loosens
 * like any other union. A schema that already has a union keeps it, and the
 * types join it through `allOf`.
 *
 * https://json-schema.org/draft/2020-12/json-schema-validation#section-6.1.1
 */
export const splitTypes: Transform = () => ({
	Schema: {
		leave: (node) => {
			if (!Array.isArray(node.type)) return;

			const types = node.type as Array<string>;
			if (types.filter((type) => type !== "null").length < 2) return;

			const union = { anyOf: types.map((type) => ({ type })) };
			delete node.type;

			if (node.oneOf || node.anyOf) node.allOf = [...((node.allOf as Array<unknown> | undefined) ?? []), union];
			else Object.assign(node, union);
		}
	}
});
