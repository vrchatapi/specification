import type { Node, Transform } from "../layer.ts";
import { resolvePointer } from "../pointer.ts";

const bodiless = new Set(["get", "head", "delete"]);
const scoped = new Set(["oauth2", "openIdConnect"]);

/**
 * What a 3.0 reader of an operation ignores or cannot find.
 *
 * - A `requestBody` on GET, HEAD or DELETE, which 3.0 says "SHALL be ignored".
 * - Roles in a security requirement for a scheme other than OAuth 2 or OpenID
 *   Connect, whose list 3.0 says "MUST be empty".
 * - A link's `operationRef` into `webhooks` or `components.pathItems`, which 3.0
 *   does not have.
 *
 * https://spec.openapis.org/oas/v3.0.3#operation-object
 * https://spec.openapis.org/oas/v3.0.3#security-requirement-object
 */
export const reportOperations: Transform = ({ version }) => {
	let root: Node;

	return {
		Root: {
			enter: (document) => {
				root = document;
			}
		},
		Operation: {
			enter: (operation, { report, location, key }) => {
				if (operation.requestBody !== undefined && bodiless.has(String(key)))
					report({ message: `OpenAPI ${version} ignores \`requestBody\` on \`${String(key)}\`.`, location: location.child("requestBody") });
			}
		},
		SecurityRequirement: {
			enter: (requirement, { report, location }) => {
				for (const [name, roles] of Object.entries(requirement)) {
					const scheme = resolvePointer(root, `#/components/securitySchemes/${name.replaceAll("~", "~0").replaceAll("/", "~1")}`) as Node | undefined;
					if (Array.isArray(roles) && roles.length > 0 && scheme && !scheme.$ref && !scoped.has(String(scheme.type)))
						report({ message: `OpenAPI ${version} lists roles only for \`oauth2\` and \`openIdConnect\` schemes.`, location: location.child(name) });
				}
			}
		},
		Link: {
			enter: (link, { report, location }) => {
				const target = link.operationRef;
				if (typeof target !== "string") return;

				const fragment = target.split("#")[1] ?? "";
				const removed = ["/webhooks/", "/components/pathItems/"].find((prefix) => fragment.startsWith(prefix));
				if (removed)
					report({
						message: `OpenAPI ${version} has no \`${removed === "/webhooks/" ? "webhooks" : "components.pathItems"}\` for this to point into.`,
						location: location.child("operationRef")
					});
			}
		}
	};
};
