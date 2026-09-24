import type { Oas3Rule } from "@redocly/openapi-core";

/**
 * 3.1 deprecates a schema's `example` in favour of the JSON Schema `examples`
 * keyword, a list.
 *
 * https://spec.openapis.org/oas/v3.1.2#schema-example
 */
export const noSchemaExample: Oas3Rule = () => ({
	Schema: {
		enter: (schema, { report, location }) => {
			if (!("example" in schema)) return;

			report({ message: "Use `examples`: 3.1 deprecates a schema's `example`.", location: location.child("example").key(), suggest: ["examples"] });
		}
	}
});
