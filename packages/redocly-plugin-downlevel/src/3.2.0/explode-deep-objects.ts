import type { Node, Transform } from "../layer.ts";

function explode(node: Node) {
	if (node.style === "deepObject") node.explode = true;
}

/**
 * 3.2 says `explode` has no effect on `deepObject`, whose one serialization is
 * the exploded one. 3.1 defaults `explode` to `false` for it and calls that
 * combination undefined, so `true` is written out.
 *
 * https://spec.openapis.org/oas/v3.2.0#parameter-explode
 * https://spec.openapis.org/oas/v3.1.1#parameter-explode
 */
export const explodeDeepObjects: Transform = () => ({
	Parameter: { leave: explode },
	Encoding: { leave: explode }
});
