import type { Node, Transform } from "../layer.ts";

/**
 * 3.0 allows no extensions on a Discriminator Object, so each moves onto the
 * schema holding the discriminator, keeping any the schema already sets.
 *
 * https://spec.openapis.org/oas/v3.0.4.html#discriminator-object
 */
export const moveDiscriminatorExtensions: Transform = () => ({
	Schema: {
		enter: (node) => {
			const discriminator = node.discriminator as Node | undefined;
			if (!discriminator) return;

			for (const key of Object.keys(discriminator)) {
				if (!key.startsWith("x-")) continue;
				node[key] ??= discriminator[key];
				delete discriminator[key];
			}
		}
	}
});
