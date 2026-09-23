import type { Transform } from "../layer.ts";

/**
 * 3.1 describes encoded strings with the JSON Schema content keywords; 3.0 uses
 * `format: byte` for base64 and `format: binary` for raw octets. A schema that
 * already has a `format` keeps it. 3.0's `byte` is RFC 4648 section 4 base64
 * only, so any other encoding is reported.
 *
 * https://spec.openapis.org/oas/v3.1.1#working-with-binary-data
 * https://spec.openapis.org/oas/v3.0.3#data-types
 */
export const lowerContent: Transform = ({ version }) => ({
	Schema: {
		leave: (node, { report, location }) => {
			const encoding = node.contentEncoding;

			if (encoding !== undefined && encoding !== "base64")
				return report({ message: `OpenAPI ${version} has no \`contentEncoding: ${String(encoding)}\`.`, location: location.child("contentEncoding") });

			const format = encoding === "base64" ? "byte" : node.contentMediaType === "application/octet-stream" ? "binary" : undefined;
			if (format && !("format" in node)) node.format = format;

			delete node.contentEncoding;
			delete node.contentMediaType;
			delete node.contentSchema;
		}
	}
});
