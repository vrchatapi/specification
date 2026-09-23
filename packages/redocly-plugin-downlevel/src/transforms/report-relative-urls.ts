import type { UserContext } from "@redocly/openapi-core";

import type { Transform } from "../layer.ts";

/**
 * Releases disagree on what a relative URL in the description's metadata is
 * relative to: 3.0.3 and 3.1.0 resolve it against the Server Object, 3.0.4
 * leaves it to the implementation, and 3.1.1 onward against the document's own
 * URI. An absolute URL means the same in all of them; a relative one is
 * reported, since the base it was written against is not in the document.
 *
 * https://spec.openapis.org/oas/v3.0.3#relative-references-in-urls
 * https://spec.openapis.org/oas/v3.1.1#relative-references-in-api-description-uris
 */
export const reportRelativeUrls: Transform = ({ version }) => {
	const check = (fields: Array<string>) => ({
		enter: (node: Record<string, unknown>, { report, location }: UserContext) => {
			for (const field of fields) {
				const value = node[field];
				if (typeof value === "string" && !URL.canParse(value))
					report({ message: `OpenAPI ${version} resolves a relative URL against a different base.`, location: location.child(field) });
			}
		}
	});

	return {
		Info: check(["termsOfService"]),
		Contact: check(["url"]),
		License: check(["url"]),
		ExternalDocs: check(["url"])
	};
};
