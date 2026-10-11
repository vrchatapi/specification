import type { Transform } from "../layer.ts";
import { extendFields } from "./extend-fields.ts";

/**
 * Moves fields the lower version cannot express with the same meaning, and that
 * no established extension carries, into an `x-` extension of the same name, so
 * the value survives for any reader that looks for it.
 *
 * Keyed by Redocly node type, so a field is recognised by the object it is on.
 */
export function vendorFields(fields: Record<string, Array<string>>): Transform {
	return extendFields(
		Object.fromEntries(Object.entries(fields).map(([type, names]) => [type, Object.fromEntries(names.map((name) => [name, [`x-${name}`]]))]))
	);
}
