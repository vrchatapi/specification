import { bundleFromString, createConfig } from "@redocly/openapi-core";

import type { Options } from "./decorator.ts";
import plugin from "./index.ts";

type Document = { components?: Record<string, Record<string, unknown>>; paths?: Record<string, unknown> } & Record<string, unknown>;

/**
 * Bundles a description through `downlevel/openapi` and returns the result with
 * its problems reduced to what a test asserts on.
 */
export async function downlevel(document: Record<string, unknown>, options: Options) {
	const config = await createConfig({
		plugins: [plugin()],
		decorators: { "downlevel/openapi": { ...options } }
	});
	const source = JSON.stringify({ info: { title: "fixture", version: "1" }, paths: {}, ...document });
	const { bundle, problems } = await bundleFromString({ source, config });

	return {
		document: bundle.parsed as Document,
		problems: problems.map(({ message, severity, location }) => ({ message, severity, pointer: location[0]?.pointer }))
	};
}

/**
 * Runs one layer: from `openapi` to the release below it.
 */
export function layer(openapi: string, version: string, options: Omit<Options, "version"> = {}) {
	const run = (document: Record<string, unknown>) => downlevel({ openapi, ...document }, { version, ...options });

	return Object.assign(run, {
		schemas: async (schemas: Record<string, unknown>) => {
			const { document, problems } = await run({ components: { schemas } });
			return { schemas: document.components?.schemas ?? {}, problems };
		}
	});
}

export const reference = (name: string) => ({ $ref: `#/components/schemas/${name}` });
