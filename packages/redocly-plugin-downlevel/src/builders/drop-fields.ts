import type { Transform } from "../layer.ts";

/**
 * Removes fields the lower version does not define and whose absence changes
 * nothing a reader validates: annotations, and hints a reader may ignore.
 *
 * Keyed by Redocly node type, so a field is recognised by the object it is on.
 */
export function dropFields(fields: Record<string, Array<string>>): Transform {
	return () =>
		Object.fromEntries(
			Object.entries(fields).map(([type, names]) => [
				type,
				{
					leave: (node: Record<string, unknown>) => {
						for (const name of names) delete node[name];
					}
				}
			])
		);
}
