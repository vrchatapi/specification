import type { Node, Transform } from "../layer.ts";
import { resolveSchema } from "../pointer.ts";

const unions = ["oneOf", "anyOf"] as const;

const typesOf = (schema: Node) => (schema.type === undefined ? undefined : ([schema.type].flat() as Array<string>));
const isNull = (schema: Node) => typesOf(schema)?.every((type) => type === "null") === true;

/**
 * 3.1 makes a union nullable with a `{type: "null"}` member; 3.0 has only
 * `nullable`, which widens the `type` beside it. A union left with one member
 * becomes that member, nullable. An `anyOf` makes each member nullable, since
 * matching several is allowed. A `oneOf` cannot: `null` would match them all.
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

				if (keyword === "oneOf")
					return report({ message: `OpenAPI ${version} cannot make a \`oneOf\` nullable: \`null\` would match every member.`, location });
				if (rest.some((member) => member.$ref !== undefined))
					return report({ message: `OpenAPI ${version} cannot make a reference nullable.`, location });

				rest.forEach(addNull);
				node[keyword] = rest;
			}
		}
	};
};
