import type { Transform } from "../layer.ts";

/**
 * 3.2.0 names 3.1's dialect as its default, an erratum 3.2.1 corrected; a 3.2.0
 * reader would validate 3.2 schema keywords against a dialect that lacks them.
 * A description that names no dialect gets the latest published 3.2 one.
 *
 * https://spec.openapis.org/oas/v3.2.1#json-schema-keywords
 */
export const pinDialect: Transform = () => ({
	Root: {
		leave: (root) => {
			root.jsonSchemaDialect ??= "https://spec.openapis.org/oas/3.2/dialect/2026-02-26";
		}
	}
});
