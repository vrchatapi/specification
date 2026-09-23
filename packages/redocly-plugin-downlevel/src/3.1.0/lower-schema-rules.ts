import type { Transform } from "../layer.ts";

const matches: Record<string, (value: unknown) => boolean> = {
	string: (value) => typeof value === "string",
	number: (value) => typeof value === "number",
	integer: (value) => Number.isInteger(value),
	boolean: (value) => typeof value === "boolean",
	array: (value) => Array.isArray(value),
	object: (value) => typeof value === "object" && value !== null && !Array.isArray(value)
};

/**
 * The rules 3.0 puts on a schema that 3.1 does not.
 *
 * - `items` must be present when `type` is `array`; `{}` is what its absence
 *   meant.
 * - `required` and `enum` need at least one entry. An empty `required` requires
 *   nothing, and an empty `enum` accepts nothing, which `not: {}` says.
 * - `default` must match `type`, and `readOnly` and `writeOnly` cannot both be
 *   true; neither has a 3.0 form, so both are reported.
 *
 * https://spec.openapis.org/oas/v3.0.3#properties
 */
export const lowerSchemaRules: Transform = ({ version }) => ({
	Schema: {
		leave: (node, { report, location }) => {
			if (node.type === "array" && node.items === undefined) node.items = {};
			if (Array.isArray(node.required) && node.required.length === 0) delete node.required;
			if (Array.isArray(node.enum) && node.enum.length === 0) {
				delete node.enum;
				node.not = {};
			}

			const accepts = typeof node.type === "string" ? matches[node.type] : undefined;
			if (accepts && "default" in node && !accepts(node.default) && !(node.default === null && node.nullable === true))
				report({ message: `OpenAPI ${version} requires \`default\` to match \`type\`.`, location: location.child("default") });

			if (node.readOnly === true && node.writeOnly === true)
				report({ message: `OpenAPI ${version} forbids \`readOnly\` and \`writeOnly\` together.`, location });
		}
	}
});
