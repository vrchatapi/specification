import { Oas3_2Types } from "@redocly/openapi-core";

import type { Layer } from "../layer.ts";
import { pinDialect } from "./pin-dialect.ts";
import { reportPositionalEncoding } from "./report-positional-encoding.ts";

/**
 * https://spec.openapis.org/oas/v3.2.0.html
 */
export const layer: Layer = {
	version: "3.2.1",
	writes: "3.2.0",
	types: Oas3_2Types,
	specVersion: "oas3_2",
	checks: [reportPositionalEncoding],
	transforms: [pinDialect]
};
