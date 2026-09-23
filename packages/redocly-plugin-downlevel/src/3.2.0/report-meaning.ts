import type { Node, Transform } from "../layer.ts";
import { resolveSchema } from "../pointer.ts";

const sequential = new Set(["application/jsonl", "application/x-ndjson", "application/json-seq", "text/event-stream", "multipart/mixed"]);
const isSequential = (media: string) => sequential.has(media) || media.endsWith("+json-seq");

/**
 * What 3.2 gives a meaning that a 3.1 reader would not take from the same
 * document.
 *
 * - `allowReserved: true` beyond `in: query`, which 3.1 applies nowhere else.
 * - `encoding` outside a request body, which 3.1 ignores there, and entries for
 *   properties the schema lacks, which 3.1 forbids.
 * - An array `schema` for `multipart/form-data`, and a `schema` for a
 *   sequential media type, which 3.2 reads item by item and 3.1 not at all.
 * - An XML `namespace` that is an IRI but not a URI.
 *
 * https://spec.openapis.org/oas/v3.2.0#sequential-media-types
 * https://spec.openapis.org/oas/v3.1.1#encoding-object
 */
export const reportMeaning: Transform = ({ version }) => {
	let root: Node;
	let bodies = 0;

	return {
		Root: {
			enter: (document) => {
				root = document;
			}
		},
		RequestBody: {
			enter: () => {
				bodies++;
			},
			leave: () => {
				bodies--;
			}
		},
		Parameter: {
			enter: (parameter, { report, location }) => {
				if (parameter.allowReserved === true && parameter.in !== "query")
					report({ message: `OpenAPI ${version} applies \`allowReserved\` only to \`in: query\`.`, location: location.child("allowReserved") });
			}
		},
		MediaType: {
			enter: (node, { report, location, key }) => {
				const name = String(key);
				const schema = node.schema ? resolveSchema(root, node.schema as Node) : undefined;

				if (node.encoding !== undefined && bodies === 0)
					report({ message: `OpenAPI ${version} applies \`encoding\` only to request bodies.`, location: location.child("encoding") });
				else if (node.encoding && schema?.properties) {
					for (const property of Object.keys(node.encoding as Node))
						if (!(property in (schema.properties as Node)))
							report({ message: `OpenAPI ${version} requires \`${property}\` to be a property of the schema.`, location: location.child(["encoding", property]) });
				}

				if (schema && isSequential(name))
					report({ message: `OpenAPI ${version} gives \`schema\` no meaning for the sequential media type \`${name}\`.`, location: location.child("schema") });
				else if (name === "multipart/form-data" && schema?.type === "array")
					report({ message: `OpenAPI ${version} gives an array \`schema\` no meaning for \`multipart/form-data\`.`, location: location.child("schema") });
			}
		},
		Xml: {
			enter: (xml, { report, location }) => {
				const namespace = xml.namespace;
				if (typeof namespace === "string" && [...namespace].some((character) => character.codePointAt(0)! > 0x7F))
					report({ message: `OpenAPI ${version} requires \`namespace\` to be a URI, and this IRI is not one.`, location: location.child("namespace") });
			}
		}
	};
};
