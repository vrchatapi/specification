import type { Transform } from "../layer.ts";

/**
 * 3.1 writes a nullable value as a type pair with `"null"`; 3.0 writes the other
 * type and `nullable: true`. `null` on its own has no 3.0 form and is reported.
 * Runs after `splitTypes` and `loosenUnions`, so no `type` names more than one
 * type besides `null`.
 *
 * https://spec.openapis.org/oas/v3.0.3#fixed-fields-19
 */
export const lowerTypes: Transform = ({ version }) => ({
	Schema: {
		leave: (schema, { report, location }) => {
			const types = [schema.type].flat();
			if (!types.includes("null")) return;

			const [other] = types.filter((type) => type !== "null");
			if (!other) return report({ message: `OpenAPI ${version} has no \`null\` type.`, location: location.child("type") });

			Object.assign(schema, { type: other, nullable: true });
		}
	}
});
