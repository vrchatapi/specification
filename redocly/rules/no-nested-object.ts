import type { Oas3Rule } from "@redocly/openapi-core";

// Untitled schemas get generated names; a nullable $ref does not.
// https://openapi-generator.tech/docs/customization/#inline-schema-naming
export const noNestedObject: Oas3Rule = () => ({
	Schema: {
		enter: (schema, { report, location }) => {
			if ((schema.title ?? "").trim().length !== 0) return;

			const members = (schema.oneOf ?? schema.anyOf ?? []).filter((member) => !("type" in member && member.type === "null"));
			if (schema.type === "object") return report({ message: "Object schemas belong in their own file under components/schemas, reached by $ref.", location });
			if (members.length >= 2) return report({ message: "Union schemas belong in their own file under components/schemas, reached by $ref.", location });

			const values = (schema.enum as Array<unknown> | undefined) ?? [];
			if (values.length >= 2 && !location.pointer.endsWith("/not"))
				report({ message: "Enum schemas belong in their own file under components/schemas, reached by $ref.", location });
		}
	}
});
