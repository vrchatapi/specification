import type { Oas3Decorator } from "@redocly/openapi-core";

import { impliedType } from "../lib/implied-type.ts";

/**
 * The keys `eslint.config.mjs` orders ahead of `type`, so a bundle reads as
 * though the source had written the type itself.
 */
const before = new Set(["id", "title", "name", "deprecated", "$ref"]);

/**
 * Writes back the `type` that `vrchat/no-implied-type` keeps out of the source.
 * JSON Schema needs none beside an `enum` or `const`, but generated clients do:
 * openapi-generator's C# client types an untyped `const` property as `Object`.
 */
export const addImpliedTypes: Oas3Decorator = () => ({
	Schema: {
		leave: (schema) => {
			const node = schema as Record<string, unknown>;
			if ("type" in node) return;
			const type = impliedType(node);
			if (type === undefined) return;

			const entries = Object.entries(node);
			const index = entries.findIndex(([key]) => !before.has(key));
			entries.splice(index === -1 ? entries.length : index, 0, ["type", type]);
			for (const key of Object.keys(node)) delete node[key];
			Object.assign(node, Object.fromEntries(entries));
		}
	}
});
