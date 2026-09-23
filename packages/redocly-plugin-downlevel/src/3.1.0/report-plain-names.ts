import type { Transform } from "../layer.ts";

/**
 * 3.1 resolves a `$ref` fragment that is not a JSON Pointer, such as `#name`, as
 * the plain name of an `$anchor`; 3.0 follows JSON Reference, whose fragments
 * are JSON Pointers, and has no anchors to find.
 *
 * https://spec.openapis.org/oas/v3.0.3#reference-object
 */
export const reportPlainNames: Transform = ({ version }) => ({
	ref: {
		enter: (reference, { report, location }) => {
			const fragment = String(reference.$ref).split("#")[1];
			if (fragment && !fragment.startsWith("/"))
				report({ message: `OpenAPI ${version} reads a \`$ref\` fragment only as a JSON Pointer.`, location });
		}
	}
});
