import type { Node, Transform } from "../layer.ts";

/**
 * 3.2 gave path items a `query` operation and `additionalOperations` for any
 * other method; 3.1 knows a fixed set of methods. Both move to
 * `x-oai-additionalOperations`, keyed by method as 3.2's `additionalOperations`
 * is, keeping any operation the extension already holds.
 *
 * https://spec.openapis.org/registry/extension/x-oai-additionalOperations.html
 */
export const lowerAdditionalOperations: Transform = () => ({
	PathItem: {
		leave: (node) => {
			const operations: Node = { ...(node.query ? { QUERY: node.query } : {}), ...((node.additionalOperations ?? {}) as Node) };
			if (Object.keys(operations).length === 0) return;

			node["x-oai-additionalOperations"] = { ...operations, ...((node["x-oai-additionalOperations"] ?? {}) as Node) };
			delete node.query;
			delete node.additionalOperations;
		}
	}
});
