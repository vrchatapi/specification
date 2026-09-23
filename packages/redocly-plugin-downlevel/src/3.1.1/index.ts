import { Oas3_1Types } from "@redocly/openapi-core";

import type { Layer } from "../layer.ts";
import { pinFormEncoding } from "../transforms/pin-form-encoding.ts";
import { reportNamespaceFragments } from "../transforms/report-namespace-fragments.ts";
import { reportRelativeUrls } from "../transforms/report-relative-urls.ts";

/**
 * https://spec.openapis.org/oas/v3.1.0.html
 */
export const layer: Layer = {
	version: "3.1.1",
	writes: "3.1.0",
	types: Oas3_1Types,
	specVersion: "oas3_1",
	checks: [reportRelativeUrls, reportNamespaceFragments],
	transforms: [pinFormEncoding]
};
