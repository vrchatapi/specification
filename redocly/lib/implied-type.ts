type JsonType = "array" | "boolean" | "integer" | "null" | "number" | "object" | "string";

function typeOf(value: unknown): JsonType {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
	return typeof value as JsonType;
}

/**
 * The `type` an `enum` or `const` already fixes: every JSON type its values
 * carry, with `integer` folded into `number` when both appear, ordered the way
 * the YAML lint orders a `type` list, `null` last.
 *
 * https://json-schema.org/draft/2020-12/json-schema-validation#section-6.1.2-2
 */
export function impliedType(schema: Record<string, unknown>): Array<JsonType> | JsonType | undefined {
	const values = Array.isArray(schema.enum) ? schema.enum : "const" in schema ? [schema.const] : undefined;
	if (!values || values.length === 0) return undefined;

	const types = new Set(values.map(typeOf));
	if (types.has("integer") && types.has("number")) types.delete("integer");

	const ordered = [...types].filter((type) => type !== "null").sort();
	if (types.has("null")) ordered.push("null");
	return ordered.length === 1 ? ordered[0] : ordered;
}

export function isImpliedType(schema: Record<string, unknown>): boolean {
	const implied = impliedType(schema);
	return implied !== undefined && JSON.stringify(schema.type) === JSON.stringify(implied);
}
