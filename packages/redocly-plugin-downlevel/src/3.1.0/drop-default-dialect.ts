import type { Transform } from "../layer.ts";

/**
 * A `jsonSchemaDialect` naming the OAS dialect says what its absence already
 * says, so it leaves nothing to keep in 3.0.
 *
 * https://spec.openapis.org/oas/v3.1.2.html#specifying-schema-dialects
 */
export const dropDefaultDialect: Transform = () => ({
	Root: {
		enter: (document) => {
			if (document.jsonSchemaDialect === "https://spec.openapis.org/oas/3.1/dialect/base") delete document.jsonSchemaDialect;
		}
	}
});
