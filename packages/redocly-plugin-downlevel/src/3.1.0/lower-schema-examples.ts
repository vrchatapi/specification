import type { Transform } from "../layer.ts";

/**
 * A 3.0 schema has one `example` where a 3.1 schema has a list of `examples`.
 * The first survives unless the schema already has an `example`, and the whole
 * list goes to `x-jsonschema-examples`.
 *
 * https://spec.openapis.org/registry/extension/x-jsonschema-examples.html
 */
export const lowerSchemaExamples: Transform = () => ({
	Schema: {
		leave: (node) => {
			if (!Array.isArray(node.examples)) return;

			if (node.examples.length > 0 && !("example" in node)) node.example = node.examples[0];
			node["x-jsonschema-examples"] ??= node.examples;
			delete node.examples;
		}
	}
});
