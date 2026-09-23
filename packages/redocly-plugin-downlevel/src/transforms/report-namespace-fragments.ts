import type { Transform } from "../layer.ts";

/**
 * 3.0.4 and 3.1.1 relaxed an XML `namespace` from an absolute URI to a
 * non-relative one, which may carry a fragment. The releases before them
 * cannot hold one that does.
 *
 * https://spec.openapis.org/oas/v3.0.4#xml-object
 */
export const reportNamespaceFragments: Transform = ({ version }) => ({
	Xml: {
		enter: (xml, { report, location }) => {
			const namespace = xml.namespace;
			if (typeof namespace === "string" && URL.canParse(namespace) && new URL(namespace).hash !== "")
				report({ message: `OpenAPI ${version} requires \`namespace\` to be an absolute URI, without a fragment.`, location: location.child("namespace") });
		}
	}
});
