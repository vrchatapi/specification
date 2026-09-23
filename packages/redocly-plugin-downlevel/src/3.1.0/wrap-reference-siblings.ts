import type { Transform } from "../layer.ts";

const annotations = new Set(["title", "description", "default", "deprecated", "readOnly", "writeOnly", "example", "externalDocs", "xml", "nullable"]);

/**
 * 3.1 applies the keywords written beside a `$ref`; 3.0 ignores them. Where one
 * constrains the value, the reference moves into an `allOf` so the constraint
 * still holds. Annotations alone stay beside the `$ref`, where 3.0 ignores them
 * as it always has.
 *
 * Visits references rather than schemas: a schema visitor is handed what a
 * reference resolves to, never the object the `$ref` is written in.
 *
 * https://spec.openapis.org/oas/v3.0.3#reference-object
 */
export const wrapReferenceSiblings: Transform = () => ({
	ref: {
		leave: (node, { type }) => {
			if (type.name !== "Schema") return;

			const siblings = Object.keys(node).filter((key) => key !== "$ref");
			if (siblings.every((key) => annotations.has(key))) return;

			node.allOf = [{ $ref: node.$ref }];
			delete node.$ref;
		}
	}
});
