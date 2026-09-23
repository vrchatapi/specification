import type { Transform } from "../layer.ts";

/**
 * Moves fields the lower version does not define into every extension that
 * carries the same thing for readers of that version, keeping any the
 * description already sets.
 *
 * Keyed by Redocly node type, then by field, so a field is recognised by the
 * object it is on.
 *
 * https://spec.openapis.org/registry/extension/index.html
 */
export function extendFields(fields: Record<string, Record<string, Array<string>>>): Transform {
	return () =>
		Object.fromEntries(
			Object.entries(fields).map(([type, extensions]) => [
				type,
				{
					leave: (node: Record<string, unknown>) => {
						for (const [name, targets] of Object.entries(extensions)) {
							if (!(name in node)) continue;
							for (const target of targets) node[target] ??= structuredClone(node[name]);
							delete node[name];
						}
					}
				}
			])
		);
}
