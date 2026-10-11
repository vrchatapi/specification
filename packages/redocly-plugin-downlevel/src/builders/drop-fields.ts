import type { Transform } from "../layer.ts";

/**
 * Removes fields whose meaning an earlier transform has already written in the
 * lower version's terms, or that mean nothing in the version being read.
 * Anything else moves to an extension through `extendFields` or `vendorFields`.
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
