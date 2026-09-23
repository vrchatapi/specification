import type { Plugin } from "@redocly/openapi-core";

import { openapi } from "./decorator.ts";

export type { Options } from "./decorator.ts";

/**
 * Registers `downlevel/openapi`, which rewrites a bundled OpenAPI 3.x
 * description as an earlier 3.x release.
 */
export default function plugin(): Plugin {
	return {
		id: "downlevel",
		decorators: { oas3: { openapi } }
	};
}
