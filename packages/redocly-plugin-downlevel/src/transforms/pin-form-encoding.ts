import type { Node, Transform } from "../layer.ts";
import { resolveSchema } from "../pointer.ts";

/**
 * 3.0.4 and 3.1.1 say an object property of an
 * `application/x-www-form-urlencoded` body is sent as JSON unless `encoding`
 * says otherwise; the releases before them described it as form style. Writing
 * the `contentType` out keeps the later reading in the earlier release.
 *
 * https://spec.openapis.org/oas/v3.0.4#encoding-application-x-www-form-urlencoded
 */
export const pinFormEncoding: Transform = () => {
	let root: Node;
	const resolve = (schema: Node): Node => resolveSchema(root, schema);

	return {
		Root: {
			enter: (document) => {
				root = document;
			}
		},
		MediaType: {
			leave: (node, { key }) => {
				if (key !== "application/x-www-form-urlencoded" || !node.schema) return;

				const properties = resolve(node.schema as Node).properties as Record<string, Node> | undefined;
				for (const [name, property] of Object.entries(properties ?? {})) {
					if (resolve(property).type !== "object") continue;

					const encoding = (node.encoding ??= {}) as Record<string, Node>;
					encoding[name] ??= { contentType: "application/json" };
				}
			}
		}
	};
};
