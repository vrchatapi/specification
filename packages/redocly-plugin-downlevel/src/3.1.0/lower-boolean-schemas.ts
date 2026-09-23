import type { Node, Transform } from "../layer.ts";

const lower = (value: unknown) => (value === true ? {} : value === false ? { not: {} } : value);

/**
 * 3.1 lets `true` stand for the schema that accepts anything and `false` for the
 * one that accepts nothing; 3.0 needs an object everywhere but
 * `additionalProperties`. Redocly never hands a visitor a boolean, so each
 * schema lowers the booleans it holds.
 *
 * https://spec.openapis.org/oas/v3.1.1#json-schema-keywords
 */
export const lowerBooleanSchemas: Transform = () => {
	const lowerIn = (node: Node, keys: Array<string>) => {
		for (const key of keys) if (typeof node[key] === "boolean") node[key] = lower(node[key]);
	};

	const lowerSchema = (node: Node) => {
		lowerIn(node, ["items", "not", "contains", "if", "then", "else", "propertyNames", "unevaluatedItems"]);
		for (const keyword of ["allOf", "anyOf", "oneOf", "prefixItems"])
			if (Array.isArray(node[keyword])) node[keyword] = (node[keyword] as Array<unknown>).map(lower);
		for (const keyword of ["properties", "patternProperties", "dependentSchemas", "$defs"]) {
			const map = node[keyword] as Node | undefined;
			if (map && typeof map === "object") lowerIn(map, Object.keys(map));
		}
	};

	const lowerHolder = (holder: unknown) => lowerIn(holder as Node, ["schema"]);

	return {
		Schema: { leave: lowerSchema },
		Parameter: { leave: lowerHolder },
		Header: { leave: lowerHolder },
		MediaType: { leave: lowerHolder },
		Components: {
			leave: (components) => {
				const schemas = components.schemas as Node | undefined;
				if (schemas) lowerIn(schemas, Object.keys(schemas));
			}
		}
	};
};
