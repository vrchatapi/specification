import { Oas3_2Types } from "@redocly/openapi-core";

import { dropFields } from "../builders/drop-fields.ts";
import { inlineComponents } from "../builders/inline-components.ts";
import { reportFields } from "../builders/report-fields.ts";
import type { Layer } from "../layer.ts";
import { describeResponses } from "./describe-responses.ts";
import { dropDefaultAllowReserved } from "./drop-default-allow-reserved.ts";
import { explodeDeepObjects } from "./explode-deep-objects.ts";
import { lowerDialect } from "./lower-dialect.ts";
import { lowerExamples } from "./lower-examples.ts";
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
			PathItem: { query: true, additionalOperations: true },
			Parameter: { in: ["querystring"], style: ["cookie"] },
			MediaType: { itemSchema: true, prefixEncoding: true, itemEncoding: true },
			Encoding: { encoding: true, prefixEncoding: true, itemEncoding: true },
			OAuth2Flows: { deviceAuthorization: true }
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
		inlineComponents("mediaTypes"),
		dropFields({
			Root: ["$self"],
			Server: ["name"],
			Tag: ["summary", "parent", "kind"],
			Response: ["summary"],
			MediaType: ["description"],
			SecurityScheme: ["deprecated", "oauth2MetadataUrl"],
			Discriminator: ["defaultMapping"]
		}),
		describeResponses
	]
};
