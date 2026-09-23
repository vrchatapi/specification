import type { Transform } from "../layer.ts";

/**
 * 3.2 says how a schema becomes XML with `nodeType`; 3.1 has `attribute` and,
 * for arrays, `wrapped`. A node type that is 3.1's default for the schema is
 * dropped, and one 3.1 has no flag for is reported.
 *
 * https://spec.openapis.org/oas/v3.2.0#xml-object
 */
export const lowerXml: Transform = ({ version }) => ({
	Schema: {
		leave: (node, { report, location }) => {
			const xml = node.xml as Record<string, unknown> | undefined;
			if (!xml || !("nodeType" in xml)) return;

			const array = [node.type].flat().includes("array");
			const unwrapped = array || "$ref" in node;

			switch (xml.nodeType) {
				case "attribute": {
					xml.attribute = true;
					break;
				}
				case "element": {
					if (array) xml.wrapped = true;
					break;
				}
				case "none": {
					if (unwrapped) break;
					return report({ message: `OpenAPI ${version} has no \`nodeType: none\`.`, location: location.child(["xml", "nodeType"]) });
				}
				default: {
					return report({
						message: `OpenAPI ${version} has no \`nodeType: ${String(xml.nodeType)}\`.`,
						location: location.child(["xml", "nodeType"])
					});
				}
			}

			delete xml.nodeType;
		}
	}
});
