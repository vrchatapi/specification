import type { Transform } from "../layer.ts";

/**
 * 3.1 made `paths` and an operation's `responses` optional. A description with
 * no paths has an empty set of them; an operation with no responses has nothing
 * 3.0 can put in their place, since its Responses Object needs at least one.
 *
 * https://spec.openapis.org/oas/v3.0.3#responses-object
 */
export const requireFields: Transform = ({ version }) => ({
	Root: {
		leave: (root) => {
			root.paths ??= {};
		}
	},
	Operation: {
		leave: (operation, { report, location }) => {
			if (operation.responses === undefined) report({ message: `OpenAPI ${version} requires \`responses\`.`, location });
		}
	}
});
