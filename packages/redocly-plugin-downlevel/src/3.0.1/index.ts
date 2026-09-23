import { Oas3Types } from "@redocly/openapi-core";

import type { Layer } from "../layer.ts";

/**
 * https://spec.openapis.org/oas/v3.0.0.html
 */
export const layer: Layer = {
	version: "3.0.1",
	writes: "3.0.0",
	types: Oas3Types,
	specVersion: "oas3_0",
	checks: [],
	transforms: []
};
