import type { Node, Transform } from "../layer.ts";
import { resolvePointer } from "../pointer.ts";

/**
 * Replaces every reference into `components[section]` with a copy of its target,
 * then removes the section, for a component type the lower version lacks.
 */
export function inlineComponents(section: string): Transform {
	return () => {
		let root: Node;

		return {
			Root: {
				enter: (document) => {
					root = document;
				},
				leave: (document) => {
					const components = document.components as Node | undefined;
					if (components) delete components[section];
				}
			},
			ref: {
				enter: (node) => {
					const reference = String(node.$ref);
					if (!reference.startsWith(`#/components/${section}/`)) return;

					const target = resolvePointer(root, reference);
					if (!target || typeof target !== "object") return;

					delete node.$ref;
					Object.assign(node, structuredClone(target));
				}
			}
		};
	};
}
