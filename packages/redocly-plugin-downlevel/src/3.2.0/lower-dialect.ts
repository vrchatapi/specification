import type { Transform } from "../layer.ts";

const dialect = "https://spec.openapis.org/oas/3.2/dialect/";
const replacement = "https://spec.openapis.org/oas/3.1/dialect/base";

function lower(node: Record<string, unknown>, field: string) {
	const value = node[field];
	if (typeof value === "string" && value.startsWith(dialect)) node[field] = replacement;
}

/**
 * The 3.2 schema dialect differs from 3.1's only by the 3.2 keywords, which
 * the other transforms in this layer lower, so a description naming it names
 * the dialect every 3.1 tool must support instead.
 *
 * https://spec.openapis.org/oas/v3.1.1#json-schema-keywords
 */
export const lowerDialect: Transform = () => ({
	Root: { leave: (root) => lower(root, "jsonSchemaDialect") },
	Schema: { leave: (schema) => lower(schema, "$schema") }
});
