import type { Node, Transform } from "../layer.ts";
import { resolveSchema } from "../pointer.ts";

/**
 * 3.2.1 lets `prefixEncoding` and `itemEncoding` stand without an item schema,
 * ignoring entries nothing matches, and reads a `multipart/form-data` array
 * schema as parts named by their items. 3.2.0 requires `itemSchema` or an array
 * `schema` for the first, and names form parts through `encoding` headers.
 *
 * https://spec.openapis.org/oas/v3.2.1#encoding-by-position
 */
export const reportPositionalEncoding: Transform = ({ version }) => {
	let root: Node;

	return {
		Root: {
			enter: (document) => {
				root = document;
			}
		},
		MediaType: {
			enter: (node, { report, location, key }) => {
				const schema = node.schema ? resolveSchema(root, node.schema as Node) : undefined;
				const positional = node.itemSchema !== undefined || schema?.type === "array";

				for (const field of ["prefixEncoding", "itemEncoding"])
					if (field in node && !positional)
						report({ message: `OpenAPI ${version} requires \`itemSchema\` or an array \`schema\` beside \`${field}\`.`, location: location.child(field) });

				if (key === "multipart/form-data" && schema?.type === "array")
					report({ message: `OpenAPI ${version} names \`multipart/form-data\` parts through \`encoding\` headers, not array items.`, location: location.child("schema") });
			}
		}
	};
};
