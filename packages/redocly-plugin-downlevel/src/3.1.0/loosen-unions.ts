import { isDeepStrictEqual } from "node:util";

import type { Node, Transform } from "../layer.ts";
import { resolveSchema } from "../pointer.ts";

const unions = ["oneOf", "anyOf"] as const;
const merged = new Set(["type", "properties", "required", "items", "enum", "discriminator"]);
const enumeration = new Set(["const", "title", "description", "deprecated"]);

/**
 * https://www.ietf.org/archive/id/draft-bhutton-json-schema-validation-01.txt
 * sections 6.2 to 6.5
 */
const rules: Record<string, Array<string>> = {
	multipleOf: ["number", "integer"],
	maximum: ["number", "integer"],
	exclusiveMaximum: ["number", "integer"],
	minimum: ["number", "integer"],
	exclusiveMinimum: ["number", "integer"],
	maxLength: ["string"],
	minLength: ["string"],
	pattern: ["string"],
	maxItems: ["array"],
	minItems: ["array"],
	uniqueItems: ["array"],
	maxProperties: ["object"],
	minProperties: ["object"]
};

/**
 * Replaces every `oneOf` and `anyOf` with one schema that accepts everything any
 * member accepts, for readers that take no unions.
 *
 * Members of one type merge: an object carries every member's properties and
 * requires only what every member requires, an array loosens its items, and a
 * keyword survives when every member gives it the same value. Members of
 * different types leave `{}`. A `null` member makes the result nullable; a
 * reference is made nullable with `nullable: true` beside the `$ref`, the form
 * openapi-generator reads, as `lowerNullMembers` explains.
 *
 * Members that each allow only listed values, by `enum` or `const`, become one
 * `enum`, the way openapi-generator's `SIMPLIFY_ONEOF_ANYOF_ENUM` rule reads such
 * a union: a single value's `title` and `description` go to
 * `x-enum-descriptions`, and its `deprecated` to `x-enum-deprecated`, so a
 * generator reading the lowered union builds what it builds from the union.
 *
 * Runs only with `loosenUnions`; otherwise `lowerNullMembers` deals with the
 * `null` members and the unions stay.
 *
 * https://github.com/OpenAPITools/openapi-generator/blob/v7.24.0/modules/openapi-generator/src/main/java/org/openapitools/codegen/OpenAPINormalizer.java#L1644
 *
 * A size or value rule written beside the union stays only where the loosened
 * schema has a type it constrains. Left on a schema of no type, generators read
 * it as a rule for a type the schema never declared.
 */
export const loosenUnions: Transform = ({ loosenUnions: enabled }) => {
	if (!enabled) return {};

	let root: Node;
	const resolve = (schema: Node): Node => resolveSchema(root, schema);

	const flatten = (member: Node): Array<Node> => {
		const resolved = resolve(member);
		const union = unions.map((keyword) => resolved[keyword]).find(Array.isArray) as Array<Node> | undefined;
		return union ? union.flatMap(flatten) : [member];
	};

	const typesOf = (schema: Node): Array<string> | undefined =>
		schema.type === undefined ? undefined : [schema.type].flat() as Array<string>;

	const valuesOf = (schema: Node): Array<unknown> | undefined =>
		Array.isArray(schema.enum) ? schema.enum : "const" in schema ? [schema.const] : undefined;

	const enumerate = (schemas: Array<Node>, typeSets: Array<Array<string> | undefined>, nullable: boolean): Node | undefined => {
		const lists = schemas.map(valuesOf);
		if (lists.includes(undefined)) return;

		const declared = typeSets.filter((types) => types !== undefined);
		if (declared.some((types) => types.length !== 1 || types[0] !== declared[0][0])) return;
		const type = declared[0]?.[0];
		if (nullable && !type) return;

		const entries: Array<{ value: unknown; description: string; deprecated: boolean }> = [];
		schemas.forEach((schema, index) => {
			const values = lists[index]!;
			const description = values.length === 1 ? [schema.title, schema.description].filter((part) => typeof part === "string" && part !== "").join(" - ") : "";
			for (const value of values) {
				const entry = { value, description, deprecated: schema.deprecated === true };
				const existing = entries.findIndex((other) => isDeepStrictEqual(other.value, value));
				if (existing === -1) entries.push(entry);
				else entries[existing] = entry;
			}
		});

		const result: Node = {};
		if (type) result.type = nullable ? [type, "null"] : type;
		for (const [key, value] of Object.entries(schemas[0]))
			if (!merged.has(key) && !enumeration.has(key) && schemas.every((schema) => key in schema && isDeepStrictEqual(schema[key], value)))
				result[key] = structuredClone(value);
		result.enum = entries.map((entry) => structuredClone(entry.value));
		if (entries.some((entry) => entry.description !== "")) result["x-enum-descriptions"] = entries.map((entry) => entry.description);
		if (entries.some((entry) => entry.deprecated)) result["x-enum-deprecated"] = entries.map((entry) => entry.deprecated);
		return result;
	};

	const loosen = (members: Array<Node>): Node => {
		let nullable = false;
		const concrete: Array<Node> = [];

		for (const member of members.flatMap(flatten)) {
			const types = typesOf(resolve(member));
			if (types?.includes("null")) nullable = true;
			if (types?.every((type) => type === "null")) continue;
			if (!concrete.some((other) => isDeepStrictEqual(other, member))) concrete.push(member);
		}

		if (concrete.length === 0) return { type: "null" };

		if (concrete.length === 1) {
			const [member] = concrete;
			if (member.$ref !== undefined) return nullable ? { ...structuredClone(member), nullable: true } : structuredClone(member);

			const result = structuredClone(member);
			const types = typesOf(result);
			if (nullable && types && !types.includes("null")) result.type = [...types, "null"];
			return result;
		}

		const schemas = concrete.map(resolve);
		const typeSets = schemas.map((schema) => typesOf(schema)?.filter((type) => type !== "null"));

		const enumerated = enumerate(schemas, typeSets, nullable);
		if (enumerated) return enumerated;

		const [type] = typeSets[0] ?? [];
		if (!type || typeSets.some((types) => types?.length !== 1 || types[0] !== type)) return {};

		const result: Node = { type: nullable ? [type, "null"] : type };

		for (const [key, value] of Object.entries(schemas[0])) {
			if (merged.has(key)) continue;
			if (schemas.every((schema) => key in schema && isDeepStrictEqual(schema[key], value)))
				result[key] = structuredClone(value);
		}

		if (schemas.every((schema) => Array.isArray(schema.enum))) {
			const values: Array<unknown> = [];
			for (const value of schemas.flatMap((schema) => schema.enum as Array<unknown>))
				if (!values.some((other) => isDeepStrictEqual(other, value))) values.push(value);
			result.enum = values;
		}

		if (schemas.some((schema) => schema.properties)) {
			const declared = new Map<string, Array<Node>>();
			for (const schema of schemas)
				for (const [name, property] of Object.entries((schema.properties ?? {}) as Record<string, Node>))
					declared.set(name, [...(declared.get(name) ?? []), property]);

			const properties: Record<string, Node> = {};
			for (const [name, declarations] of declared) properties[name] = loosen(declarations);
			result.properties = properties;
		}

		const required = schemas
			.map((schema) => (schema.required ?? []) as Array<string>)
			.reduce((left, right) => left.filter((name) => right.includes(name)));
		if (required.length > 0) result.required = required;

		if (schemas.every((schema) => schema.items)) {
			result.items = loosen(schemas.map((schema) => schema.items as Node));
		}

		return result;
	};

	return {
		Root: {
			enter: (document) => {
				root = document;
			}
		},
		Schema: {
			leave: (node) => {
				const keyword = unions.find((candidate) => Array.isArray(node[candidate]));
				if (!keyword) return;

				const result = loosen(node[keyword] as Array<Node>);

				const types = typesOf(resolve(result)) ?? [];
				const applies = (key: string) => !(key in rules) || rules[key].some((type) => types.includes(type));
				const own = Object.fromEntries(
					Object.entries(node).filter(([key]) => !unions.includes(key as never) && key !== "discriminator" && applies(key))
				);
				for (const key of Object.keys(node)) delete node[key];
				Object.assign(node, result, own);
			}
		}
	};
};
