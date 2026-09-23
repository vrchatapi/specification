import type { Node, Transform } from "../layer.ts";

/**
 * 3.0.4 and 3.1.1 say an object property of an
 * `application/x-www-form-urlencoded` body is sent as JSON unless `encoding`
 * says otherwise; the releases before them described it as form style. Writing
 * the `contentType` out keeps the later reading in the earlier release.
 *
 * https://spec.openapis.org/oas/v3.0.4#encoding-application-x-www-form-urlencoded
 */
export const pinFormEncoding: Transform = () => ({
	MediaType: {
		leave: (node, { key }) => {
			if (key !== "application/x-www-form-urlencoded") return;

			const properties = (node.schema as Node | undefined)?.properties as Record<string, Node> | undefined;
			for (const [name, property] of Object.entries(properties ?? {})) {
				if (property.type !== "object") continue;

				const encoding = (node.encoding ??= {}) as Record<string, Node>;
				encoding[name] ??= { contentType: "application/json" };
			}
		}
	}
});
