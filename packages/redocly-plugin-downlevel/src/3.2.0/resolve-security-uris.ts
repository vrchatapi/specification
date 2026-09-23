import { unescapePointerFragment } from "@redocly/openapi-core";

import type { Node, Transform } from "../layer.ts";

const prefix = "#/components/securitySchemes/";
const componentName = /^[\w.-]+$/;

/**
 * 3.2 lets a security requirement name its scheme by URI as well as by
 * component name; 3.1 takes only the name. A URI pointing at a scheme in this
 * document's components becomes that name; any other is reported. A key shaped
 * like a component name is one, declared or not.
 *
 * https://spec.openapis.org/oas/v3.2.0#security-requirement-object
 */
export const resolveSecurityUris: Transform = ({ version }) => {
	let schemes: Node;

	return {
		Root: {
			enter: (root) => {
				schemes = ((root.components as Node | undefined)?.securitySchemes as Node | undefined) ?? {};
			}
		},
		SecurityRequirement: {
			leave: (node, { report, location }) => {
				for (const name of Object.keys(node)) {
					if (name in schemes || componentName.test(name)) continue;

					const component = name.startsWith(prefix) ? unescapePointerFragment(name.slice(prefix.length)) : undefined;
					if (!component || !(component in schemes)) {
						report({ message: `OpenAPI ${version} names a security scheme only by its name under \`components\`.`, location: location.child(name) });
						continue;
					}

					const entries = Object.entries(node).map(([key, value]) => [key === name ? component : key, value]);
					for (const key of Object.keys(node)) delete node[key];
					Object.assign(node, Object.fromEntries(entries));
				}
			}
		}
	};
};
