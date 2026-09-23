import type { UserContext } from "@redocly/openapi-core";

import type { Transform } from "../layer.ts";

type Fields = Record<string, Array<unknown> | true>;

/**
 * Reports fields, or particular values of them, that change what a reader
 * accepts and that the lower version has no way to say.
 *
 * Keyed by Redocly node type, then by field: `true` reports the field whatever
 * it holds, an array reports only those values.
 */
export function reportFields(fields: Record<string, Fields>): Transform {
	return ({ version }) =>
		Object.fromEntries(
			Object.entries(fields).map(([type, reported]) => [
				type,
				{
					enter: (node: Record<string, unknown>, { report, location }: UserContext) => {
						for (const name of Object.keys(node)) {
							const values = reported[name];
							if (values === undefined) continue;
							if (values === true)
								report({ message: `OpenAPI ${version} has no \`${name}\`.`, location: location.child(name) });
							else if (values.includes(node[name]))
								report({ message: `OpenAPI ${version} has no \`${name}: ${String(node[name])}\`.`, location: location.child(name) });
						}
					}
				}
			])
		);
}
