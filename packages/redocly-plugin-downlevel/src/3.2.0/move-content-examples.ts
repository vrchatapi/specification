import type { UserContext } from "@redocly/openapi-core";

import type { Node, Transform } from "../layer.ts";

/**
 * 3.2 lets a Parameter or Header carry `example` or `examples` beside
 * `content`; 3.1 allows them only beside `schema`. With `content`, they move
 * into its one Media Type Object, unless it already has examples of its own.
 *
 * https://spec.openapis.org/oas/v3.2.0#common-fixed-fields
 */
export const moveContentExamples: Transform = ({ version }) => {
	const move = (node: Node, { report, location }: UserContext) => {
		const content = node.content as Record<string, Node> | undefined;
		if (!content) return;

		const [media] = Object.values(content);
		for (const field of ["example", "examples"]) {
			if (!(field in node)) continue;

			if (!media || "example" in media || "examples" in media) {
				report({ message: `OpenAPI ${version} has no room for \`${field}\` beside \`content\`: the media type has its own.`, location: location.child(field) });
				continue;
			}

			media[field] = node[field];
			delete node[field];
		}
	};

	return {
		Parameter: { leave: move },
		Header: { leave: move }
	};
};
