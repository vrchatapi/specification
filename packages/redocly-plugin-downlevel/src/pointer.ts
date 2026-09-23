import { unescapePointerFragment } from "@redocly/openapi-core";

import type { Node } from "./layer.ts";

/**
 * Follows a local JSON Pointer reference (`#/...`) through the bundled document.
 * Returns undefined for any other reference, or one that leads nowhere.
 *
 * https://www.rfc-editor.org/rfc/rfc6901
 */
export function resolvePointer(root: unknown, reference: string): unknown {
	if (!reference.startsWith("#/")) return undefined;

	let node = root;
	for (const part of reference.slice(2).split("/")) {
		if (!node || typeof node !== "object") return undefined;
		node = (node as Node)[unescapePointerFragment(part)];
	}
	return node;
}

/**
 * Follows `$ref` until it reaches a schema that is not one.
 */
export function resolveSchema(root: unknown, schema: Node): Node {
	const seen = new Set<Node>();
	let node = schema;

	while (typeof node.$ref === "string" && !seen.has(node)) {
		seen.add(node);
		const target = resolvePointer(root, node.$ref);
		if (!target || typeof target !== "object") return node;
		node = target as Node;
	}
	return node;
}
