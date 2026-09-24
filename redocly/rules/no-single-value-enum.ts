import type { Oas3Rule } from "@redocly/openapi-core";

/**
 * An `enum` of one value is a `const`, which 3.1 schemas have.
 *
 * https://www.ietf.org/archive/id/draft-bhutton-json-schema-validation-01.txt section 6.1.3
 */
export const noSingleValueEnum: Oas3Rule = () => ({
	Schema: {
		enter: (schema, { report, location }) => {
			if (!Array.isArray(schema.enum) || schema.enum.length !== 1) return;

			report({ message: "Use `const`: an `enum` of one value is a `const`.", location: location.child("enum").key(), suggest: ["const"] });
		}
	}
});
