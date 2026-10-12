import type { Transform } from "../layer.ts";

// 3.0 has no tuples: each item may take any of the tuple's positions.
// https://json-schema.org/draft/2020-12/json-schema-core#section-10.3.1.1
export const lowerPrefixItems: Transform = () => ({
	Schema: {
		enter: (node) => {
			const { prefixItems, items } = node;
			if (!Array.isArray(prefixItems)) return;

			node["x-prefixItems"] = prefixItems;
			delete node.prefixItems;

			if (items === undefined) return;
			if (items === false) {
				node.items = { anyOf: [...prefixItems] };
				node.maxItems = Math.min(prefixItems.length, (node.maxItems as number | undefined) ?? Infinity);
				return;
			}

			node.items = { anyOf: [...prefixItems, items] };
		}
	}
});
