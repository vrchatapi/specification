import type { Oas3Rule } from "@redocly/openapi-core";

/**
 * A schema in its own file carries a title taken from that file, so an object
 * without one is still nested inside another schema. Adding a title in place
 * would satisfy the rule without moving the object, which is why the message
 * asks for the file rather than the title.
 */
export const noNestedObject: Oas3Rule = () => ({
	Schema: {
		enter: (schema, { report, location }) => {
			if (schema.type !== "object" || (schema.title ?? "").trim().length !== 0) return;

			report({
				message: "Object schemas belong in their own file under components/schemas, reached by $ref.",
				location
			});
		}
	}
});
