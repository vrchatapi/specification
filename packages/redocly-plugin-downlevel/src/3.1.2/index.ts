import { Oas3_1Types } from "@redocly/openapi-core";

import type { Layer } from "../layer.ts";

/**
 * https://spec.openapis.org/oas/v3.1.1.html
 */
export const layer: Layer = {
	version: "3.1.2",
	writes: "3.1.1",
	types: Oas3_1Types,
	specVersion: "oas3_1",
	checks: [],
	transforms: []
};
