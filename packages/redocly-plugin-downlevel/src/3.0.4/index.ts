import { Oas3Types } from "@redocly/openapi-core";

import type { Layer } from "../layer.ts";
import { pinFormEncoding } from "../transforms/pin-form-encoding.ts";
import { reportNamespaceFragments } from "../transforms/report-namespace-fragments.ts";
import { reportRelativeUrls } from "../transforms/report-relative-urls.ts";
import { pinByteEncoding } from "./pin-byte-encoding.ts";
import { reportDelimitedObjects } from "./report-delimited-objects.ts";

/**
 * https://spec.openapis.org/oas/v3.0.3.html
 */
export const layer: Layer = {
	version: "3.0.4",
	writes: "3.0.3",
	types: Oas3Types,
	specVersion: "oas3_0",
	checks: [reportRelativeUrls, reportNamespaceFragments, reportDelimitedObjects],
	transforms: [pinFormEncoding, pinByteEncoding]
};
