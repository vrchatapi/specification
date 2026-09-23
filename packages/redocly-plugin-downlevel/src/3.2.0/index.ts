import { Oas3_2Types } from "@redocly/openapi-core";

import { dropFields } from "../builders/drop-fields.ts";
import { extendFields } from "../builders/extend-fields.ts";
import { inlineComponents } from "../builders/inline-components.ts";
import { reportFields } from "../builders/report-fields.ts";
import type { Layer } from "../layer.ts";
import { describeResponses } from "./describe-responses.ts";
import { dropDefaultAllowReserved } from "./drop-default-allow-reserved.ts";
import { explodeDeepObjects } from "./explode-deep-objects.ts";
import { lowerAdditionalOperations } from "./lower-additional-operations.ts";
import { lowerDeviceAuthorization } from "./lower-device-authorization.ts";
import { lowerDialect } from "./lower-dialect.ts";
import { lowerExamples } from "./lower-examples.ts";
import { lowerTags } from "./lower-tags.ts";
import { lowerXml } from "./lower-xml.ts";
import { moveContentExamples } from "./move-content-examples.ts";
import { reportMeaning } from "./report-meaning.ts";
import { resolveSecurityUris } from "./resolve-security-uris.ts";

/**
 * https://spec.openapis.org/oas/v3.1.2.html
 * https://learn.openapis.org/upgrading/v3.1-to-v3.2.html
 */
export const layer: Layer = {
	version: "3.2.0",
	writes: "3.1.2",
	types: Oas3_2Types,
	specVersion: "oas3_2",
	checks: [
		reportFields({
			Parameter: { in: ["querystring"], style: ["cookie"] },
			Encoding: { prefixEncoding: true }
		}),
		reportMeaning
	],
	transforms: [
		resolveSecurityUris,
		lowerDialect,
		explodeDeepObjects,
		dropDefaultAllowReserved,
		lowerXml,
		lowerExamples,
		moveContentExamples,
		lowerTags,
		lowerAdditionalOperations,
		lowerDeviceAuthorization,
		extendFields({
			Root: { $self: ["x-oai-$self"] },
			Server: { name: ["x-oai-name"] },
			Response: { summary: ["x-oai-summary", "x-summary"] },
			SecurityScheme: { deprecated: ["x-oai-deprecated"] },
			MediaType: { itemSchema: ["x-oai-itemSchema"], prefixEncoding: ["x-oai-prefixEncoding"], itemEncoding: ["x-oai-itemEncoding"] },
			Encoding: { encoding: ["x-oai-encoding"], itemEncoding: ["x-oai-itemEncoding"] }
		}),
		inlineComponents("mediaTypes"),
		dropFields({
			Tag: ["summary", "parent", "kind"],
			MediaType: ["description"],
			SecurityScheme: ["oauth2MetadataUrl"],
			Discriminator: ["defaultMapping"]
		}),
		describeResponses
	]
};
