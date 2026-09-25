import type { Plugin } from "@redocly/openapi-core";

import { decorators } from "./decorators/index.ts";
import { rules } from "./rules/index.ts";
import { typeExtension } from "./type-extension.ts";

/**
 * Redocly transpiles this file alone, so every import within the plugin names
 * its `.ts` extension outright; without one the loader reports the module as
 * missing.
 */
export default function plugin(): Plugin {
	return {
		id: "vrchat",
		rules: { oas3: rules },
		decorators: { oas3: decorators },
		typeExtension
	};
}
