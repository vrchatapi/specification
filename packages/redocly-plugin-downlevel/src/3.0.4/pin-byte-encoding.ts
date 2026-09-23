import type { Node, Transform } from "../layer.ts";

/**
 * 3.0.4 sends a `format: byte` multipart part as `application/octet-stream`;
 * 3.0.3's table said `text/plain`. Writing the `contentType` out keeps the later
 * reading.
 *
 * https://spec.openapis.org/oas/v3.0.4#encoding-object
 */
export const pinByteEncoding: Transform = () => ({
	MediaType: {
		leave: (node, { key }) => {
			if (!String(key).startsWith("multipart/")) return;

			const properties = (node.schema as Node | undefined)?.properties as Record<string, Node> | undefined;
			for (const [name, property] of Object.entries(properties ?? {})) {
				if (property.format !== "byte") continue;

				const encoding = (node.encoding ??= {}) as Record<string, Node>;
				encoding[name] ??= { contentType: "application/octet-stream" };
			}
		}
	}
});
