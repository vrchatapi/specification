import type { Oas3Rule } from "@redocly/openapi-core";

/**
 * `vrchat/incomplete-enums` publishes an incomplete enum's values as its
 * `examples`, the list a generator offers as the known values. Examples written
 * beside it would stand in for that list and leave values out.
 */
export const noIncompleteEnumExamples: Oas3Rule = () => ({
	Schema: {
		enter: (schema, { report, location }) => {
			if (schema["x-incomplete"] !== true || !Array.isArray(schema.enum) || schema.examples === undefined) return;

			report({ message: "Remove `examples`: the bundles publish an incomplete enum's values as its examples.", location: location.child("examples").key() });
		}
	}
});
