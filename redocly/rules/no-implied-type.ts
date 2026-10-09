import type { Oas3Rule } from "@redocly/openapi-core";

import { isImpliedType } from "../lib/implied-type.ts";

/**
 * An `enum` or `const` already fixes the type of every value it admits, so a
 * `type` beside it restates them. `vrchat/add-implied-types` writes it back into
 * each bundle for the clients that need it.
 *
 * https://json-schema.org/draft/2020-12/json-schema-validation#section-6.1.2-2
 */
export const noImpliedType: Oas3Rule = () => ({
	Schema: {
		enter: (schema, { report, location }) => {
			if (!isImpliedType(schema as Record<string, unknown>)) return;

			report({
				message: `\`${Array.isArray(schema.enum) ? "enum" : "const"}\` implies this \`type\`. Remove it; the bundles write it back.`,
				location: location.child("type")
			});
		}
	}
});
