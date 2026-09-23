import { normalizeTypes, normalizeVisitors, unescapePointerFragment, walkDocument } from "@redocly/openapi-core";
import type { Location, LocationObject, Oas3Decorator, Oas3Visitor, WalkContext } from "@redocly/openapi-core";

import type { Layer, Transform } from "./layer.ts";
import { layers } from "./layers.ts";

export interface Options {
	/**
	 * The version to write: a release such as `3.0.3`, or a minor version such as
	 * `3.0` for its latest release.
	 */
	version?: string;
	/**
	 * Replace every `oneOf` and `anyOf` with one schema that accepts everything
	 * its members accept, for readers that take no unions.
	 */
	loosenUnions?: boolean;
}

/**
 * Maps a location in the bundled document back to the file it was written in,
 * through the deepest node on its path that bundling walked.
 */
function locate(root: unknown, origins: WeakMap<object, Location>, { pointer }: LocationObject): Location | undefined {
	const parts = (pointer ?? "#/").slice(2).split("/").filter(Boolean).map(unescapePointerFragment);
	let node = root;
	let found: Location | undefined;
	let depth = 0;

	for (const [index, part] of [undefined, ...parts].entries()) {
		if (index > 0) node = (node as Record<string, unknown> | undefined)?.[part as string];
		if (!node || typeof node !== "object") break;

		const origin = origins.get(node);
		if (origin) [found, depth] = [origin, index];
	}

	return depth < parts.length ? found?.child(parts.slice(depth)) : found;
}

const reaches = (version: string, target: string) => version === target || version.startsWith(`${target}.`);

function plan(from: string, target: string): Array<Layer> | undefined {
	const chain: Array<Layer> = [];
	let version = from;

	while (!reaches(version, target)) {
		const layer = layers.find((candidate) => candidate.version === version);
		if (!layer) return undefined;

		chain.push(layer);
		version = layer.writes;
	}

	return chain;
}

/**
 * Rewrites the bundled description as an earlier OpenAPI version, one release
 * at a time, for readers that cannot take the version it is written in.
 *
 * Runs once bundling has finished, so every reference is internal. Each layer
 * runs all its checks, then its transforms, and the run ends at the first layer
 * that reports anything.
 */
export const openapi: Oas3Decorator = ({ version: target, loosenUnions = false }: Options) => {
	const origins = new WeakMap<object, Location>();

	return {
		any: {
			enter: (node, { location }) => {
				if (node && typeof node === "object") origins.set(node, location);
			}
		},
		Root: {
			leave: (root, { report, location, config }) => {
				if (!target) return report({ message: "Set `version` to the OpenAPI version to write, such as `3.0`.", location });

				const from = String(root.openapi);
				const chain = plan(from, target);
				if (!chain)
					return report({
						message: `Cannot downlevel OpenAPI ${from} to ${target}.`,
						location: location.child("openapi")
					});

				for (const layer of chain) {
					const types = normalizeTypes(layer.types);

					const run = (transform: Transform) => {
						const context: WalkContext = { problems: [], specVersion: layer.specVersion, config, visitorsData: {} };

						walkDocument({
							document: { source: location.source, parsed: root },
							rootType: types.Root,
							normalizedVisitors: normalizeVisitors(
								[{ ruleId: "downlevel/openapi", severity: "error", visitor: transform({ version: layer.writes, loosenUnions }) as Oas3Visitor }],
								types
							),
							resolvedRefMap: new Map(),
							ctx: context
						});

						for (const problem of context.problems)
							report({ message: problem.message, location: locate(root, origins, problem.location[0]) ?? problem.location });
						return context.problems.length;
					};

					if (layer.checks.map(run).some((count) => count > 0)) return;
					for (const transform of layer.transforms) if (run(transform) > 0) return;

					root.openapi = layer.writes;
				}
			}
		}
	};
};
