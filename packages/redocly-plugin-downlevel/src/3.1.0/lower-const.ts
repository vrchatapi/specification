import { isDeepStrictEqual } from "node:util";

import type { Transform } from "../layer.ts";

/**
 * 3.0 has no `const`; an `enum` of one value says the same.
 */
export const lowerConst: Transform = ({ version }) => ({
	Schema: {
		leave: (node, { report, location }) => {
			if (!("const" in node)) return;

			const value = node.const;
			if (Array.isArray(node.enum) && !node.enum.some((member) => isDeepStrictEqual(member, value)))
				return report({ message: `OpenAPI ${version} cannot express a \`const\` outside \`enum\`.`, location: location.child("const") });

			node.enum = [value];
			delete node.const;
		}
	}
});
