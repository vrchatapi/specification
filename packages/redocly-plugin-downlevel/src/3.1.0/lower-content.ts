import type { Transform } from "../layer.ts";

const keywords = ["contentEncoding", "contentMediaType", "contentSchema"] as const;

/**
 * 3.1 describes encoded strings with the JSON Schema content keywords; 3.0 uses
 * `format: byte` for base64 and `format: binary` for raw octets. A schema that
 * already has a `format` keeps it. The keywords themselves, which are
 * annotations in 3.1, go to their `x-jsonschema-*` extensions, so an encoding
 * 3.0 has no format for survives too.
 *
 * https://spec.openapis.org/oas/v3.1.1#working-with-binary-data
 * https://spec.openapis.org/oas/v3.0.3#data-types
 * https://spec.openapis.org/registry/extension/x-jsonschema-contentEncoding.html
 */
export const lowerContent: Transform = () => ({
	Schema: {
		leave: (node) => {
			const format = node.contentEncoding === "base64" ? "byte" : node.contentMediaType === "application/octet-stream" ? "binary" : undefined;
			if (format && !("format" in node)) node.format = format;

			for (const keyword of keywords) {
				if (!(keyword in node)) continue;
				node[`x-jsonschema-${keyword}`] ??= node[keyword];
				delete node[keyword];
			}
		}
	}
});
