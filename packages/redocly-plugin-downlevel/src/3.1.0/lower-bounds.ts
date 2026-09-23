import type { Transform } from "../layer.ts";

const bounds = [
	{ exclusive: "exclusiveMinimum", inclusive: "minimum", tighter: (limit: number, bound: number) => limit > bound },
	{ exclusive: "exclusiveMaximum", inclusive: "maximum", tighter: (limit: number, bound: number) => limit < bound }
] as const;

/**
 * 3.1 writes an exclusive bound as a number of its own; 3.0 writes the number in
 * `minimum` or `maximum` and marks it exclusive with a boolean. Where a schema
 * has both, the tighter one survives.
 *
 * https://spec.openapis.org/oas/v3.0.3#properties
 */
export const lowerBounds: Transform = () => ({
	Schema: {
		leave: (node) => {
			for (const { exclusive, inclusive, tighter } of bounds) {
				const bound = node[exclusive];
				if (typeof bound !== "number") continue;

				const limit = node[inclusive];
				if (typeof limit === "number" && tighter(limit, bound)) {
					delete node[exclusive];
					continue;
				}

				node[inclusive] = bound;
				node[exclusive] = true;
			}
		}
	}
});
