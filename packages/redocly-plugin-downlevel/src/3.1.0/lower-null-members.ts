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
 * Runs unless `loosenUnions` is set, in which case the unions go altogether.
 *
 * https://spec.openapis.org/oas/v3.0.3#fixed-fields-19
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
					if (types && !types.includes("null")) member.type = [...types, "null"];
				};

				if (rest.length === 1) {
					const [member] = rest;
					if (member.$ref !== undefined) return report({ message: `OpenAPI ${version} cannot make a reference nullable.`, location });

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

				const target = rest.find((member) => member.$ref === undefined && typesOf(member) !== undefined);
				if (!target) return report({ message: `OpenAPI ${version} cannot make a reference nullable.`, location });

				addNull(target);
				node[keyword] = rest;
			}
		}
	};
};
