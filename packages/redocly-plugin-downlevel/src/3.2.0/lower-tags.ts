import type { Node, Transform } from "../layer.ts";

/**
 * 3.2 gave tags a `summary`, a `parent` and a `kind`; 3.1 renderers read the same
 * things from extensions. A summary becomes the tag's `x-displayName`. A badge
 * tag becomes an entry in the `x-badges` of each operation that carries it. The
 * hierarchy becomes `x-tagGroups`, one group per top-level tag holding it and
 * every tag beneath it: a renderer leaves out any tag no group names, so every
 * navigation tag goes in one. Extensions the description already carries stay.
 *
 * https://learn.openapis.org/upgrading/v3.1-to-v3.2.html#migration-examples-from-extensions-to-native-tags
 * https://redocly.com/docs/realm/content/api-docs/openapi-extensions/x-tag-groups
 * https://github.com/scalar/scalar/blob/c0f6f096d/packages/schemas/src/extensions/operation/x-badge.ts
 */
export const lowerTags: Transform = () => {
	const badges = new Map<string, string>();

	return {
		Root: {
			enter: (document) => {
				const tags = (document.tags ?? []) as Array<Node>;
				const byName = new Map(tags.map((tag) => [tag.name as string, tag]));
				const label = (tag: Node) => (tag.summary ?? tag.name) as string;

				for (const tag of tags) {
					if (tag.summary !== undefined) tag["x-displayName"] ??= tag.summary;
					if (tag.kind === "badge") badges.set(tag.name as string, label(tag));
				}

				if (document["x-tagGroups"] !== undefined || !tags.some((tag) => typeof tag.parent === "string")) return;

				const top = (tag: Node) => {
					const seen = new Set<Node>([tag]);
					let current = tag;
					for (let parent = byName.get(current.parent as string); parent && !seen.has(parent); parent = byName.get(current.parent as string)) {
						seen.add(parent);
						current = parent;
					}
					return current;
				};

				const groups = new Map<Node, Array<string>>();
				for (const tag of tags) {
					if (tag.kind === "badge") continue;
					const root = top(tag);
					groups.set(root, [...(groups.get(root) ?? []), tag.name as string]);
				}
				document["x-tagGroups"] = [...groups].map(([root, members]) => ({ name: label(root), tags: members }));
			}
		},
		Operation: {
			enter: (operation) => {
				const names = ((operation.tags ?? []) as Array<string>).filter((name) => badges.has(name)).map((name) => badges.get(name)!);
				if (names.length === 0) return;

				const existing = (operation["x-badges"] ?? []) as Array<Node>;
				const added = names.filter((name) => !existing.some((badge) => badge.name === name)).map((name) => ({ name }));
				if (added.length > 0) operation["x-badges"] = [...existing, ...added];
			}
		}
	};
};
