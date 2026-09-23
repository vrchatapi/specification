import type { Node, Transform } from "../layer.ts";
import { resolveSchema } from "../pointer.ts";

const unions = ["oneOf", "anyOf"] as const;

const typesOf = (schema: Node) => (schema.type === undefined ? undefined : ([schema.type].flat() as Array<string>));
const isNull = (schema: Node) => typesOf(schema)?.every((type) => type === "null") === true;
const acceptsNull = (schema: Node) => typesOf(schema)?.includes("null") ?? true;

/**
 * 3.1 makes a union nullable with a `{type: "null"}` member; 3.0 has only
 * `nullable`, which widens the `type` beside it. The `null` member goes, and
 * one other member takes `null` instead: the first one written inline with a
 * `type`, so a `oneOf` still finds exactly one match for `null`. A union left
 * with one member becomes that member.
 *
 * Where another member already takes `null`, an `anyOf` needs nothing more,
 * and a `oneOf` rejected `null` all along, since it matched twice; 3.0 cannot
 * say that, so it is reported. A member without a `type` counts as taking
 * `null`.
 *
 * A reference has no `type` to widen, so `nullable: true` goes beside the
 * `$ref`. 3.0 says keywords beside a `$ref` are ignored, but openapi-generator
 * reads that pair as a nullable reference, and writes it itself when it
 * simplifies the same union.
 *
 * Runs unless `loosenUnions` is set, in which case the unions go altogether.
 *
 * https://spec.openapis.org/oas/v3.0.3#fixed-fields-19
 * https://github.com/OpenAPITools/openapi-generator/blob/v7.25.0/modules/openapi-generator/src/main/java/org/openapitools/codegen/utils/ModelUtils.java#L2597-L2625
 */
export const lowerNullMembers: Transform = ({ version, loosenUnions }) => {
	if (loosenUnions) return {};

	let root: Node;

	return {
		Root: {
			enter: (document) => {
				root = document;
			}
		},
		Schema: {
			leave: (node, { report, location }) => {
				const keyword = unions.find((candidate) => Array.isArray(node[candidate]));
				if (!keyword) return;

				const members = node[keyword] as Array<Node>;
				const rest = members.filter((member) => !isNull(resolveSchema(root, member)));
				if (rest.length === members.length) return;

				const addNull = (member: Node) => {
					const types = typesOf(member);
					if (member.$ref !== undefined) member.nullable = true;
					else if (types && !types.includes("null")) member.type = [...types, "null"];
				};

				if (rest.length === 1) {
					const [member] = rest;
					delete node[keyword];
					const own = { ...node };
					for (const key of Object.keys(node)) delete node[key];
					Object.assign(node, member, own);
					addNull(node);
					return;
				}

				if (rest.some((member) => acceptsNull(resolveSchema(root, member)))) {
					if (keyword === "oneOf")
						return report({ message: `OpenAPI ${version} cannot say this \`oneOf\`: \`null\` matches more than one member.`, location });
					node[keyword] = rest;
					return;
				}

				const target = rest.find((member) => member.$ref === undefined && typesOf(member) !== undefined) ?? rest.find((member) => member.$ref !== undefined)!;
				addNull(target);
				node[keyword] = rest;
			}
		}
	};
};
