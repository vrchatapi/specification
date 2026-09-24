import type { Oas3Rule } from "@redocly/openapi-core";

/**
 * An empty schema accepts any value, which is what `Unknown` says by name. The
 * named schema marks every value the description has yet to settle, and points a
 * reader at how to help settle it.
 */
export const preferUnknown: Oas3Rule = () => ({
	Schema: {
		enter: (schema, { report, location }) => {
			if (Object.keys(schema).length !== 0) return;

			report({ message: "Use `$ref: Unknown` for a value of any shape.", location });
		}
	}
});
