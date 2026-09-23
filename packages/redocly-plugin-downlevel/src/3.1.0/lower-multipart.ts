import type { Node, Transform } from "../layer.ts";

const constraining = ["type", "$ref", "allOf", "anyOf", "oneOf", "not", "enum", "const"];
function typeless(schema: unknown) {
	return !!schema && typeof schema === "object" && !constraining.some((keyword) => keyword in (schema as Node));
}

/**
 * In multipart, 3.1 sends a part whose schema has no `type` as
 * `application/octet-stream`; 3.0 bases that default on `format: binary`, and
 * has no default for a part without a type. Such parts become binary strings.
 *
 * 3.0 also applies `style`, `explode` and `allowReserved` only to
 * `application/x-www-form-urlencoded`, so in multipart they are reported.
 *
 * https://spec.openapis.org/oas/v3.1.1#encoding-object
 * https://spec.openapis.org/oas/v3.0.3#encoding-object
 */
export const lowerMultipart: Transform = ({ version }) => ({
	MediaType: {
		leave: (node, { report, location, key }) => {
			if (!String(key).startsWith("multipart/")) return;

			const properties = (node.schema as Node | undefined)?.properties as Record<string, Node> | undefined;
			for (const [name, property] of Object.entries(properties ?? {})) {
				if (typeless(property)) properties![name] = { ...property, type: "string", format: "binary" };
				else if (property.type === "array" && typeless(property.items)) property.items = { ...(property.items as Node), type: "string", format: "binary" };
			}

			for (const [name, encoding] of Object.entries((node.encoding ?? {}) as Record<string, Node>))
				for (const field of ["style", "explode", "allowReserved"])
					if (field in encoding)
						report({ message: `OpenAPI ${version} ignores \`${field}\` in multipart.`, location: location.child(["encoding", name, field]) });
		}
	}
});
