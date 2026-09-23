import { Oas3_1Types } from "@redocly/openapi-core";

import { dropFields } from "../builders/drop-fields.ts";
import { extendFields } from "../builders/extend-fields.ts";
import { inlineComponents } from "../builders/inline-components.ts";
import { reportFields } from "../builders/report-fields.ts";
import type { Layer } from "../layer.ts";
import { reportRelativeUrls } from "../transforms/report-relative-urls.ts";
import { dropEmptyPathItems } from "./drop-empty-path-items.ts";
import { loosenUnions } from "./loosen-unions.ts";
import { lowerBooleanSchemas } from "./lower-boolean-schemas.ts";
import { lowerBounds } from "./lower-bounds.ts";
import { lowerConst } from "./lower-const.ts";
import { lowerContent } from "./lower-content.ts";
import { lowerMultipart } from "./lower-multipart.ts";
import { lowerNullMembers } from "./lower-null-members.ts";
import { lowerSchemaExamples } from "./lower-schema-examples.ts";
import { lowerSchemaRules } from "./lower-schema-rules.ts";
import { lowerTypes } from "./lower-types.ts";
import { reportOperations } from "./report-operations.ts";
import { reportPlainNames } from "./report-plain-names.ts";
import { requireFields } from "./require-fields.ts";
import { splitTypes } from "./split-types.ts";
import { wrapReferenceSiblings } from "./wrap-reference-siblings.ts";

/**
 * https://spec.openapis.org/oas/v3.0.4.html
 * https://learn.openapis.org/upgrading/v3.0-to-v3.1.html
 */
export const layer: Layer = {
	version: "3.1.0",
	writes: "3.0.4",
	types: Oas3_1Types,
	specVersion: "oas3_1",
	checks: [
		reportFields({
			Schema: {
				prefixItems: true,
				dependentRequired: true,
				dependencies: true,
				unevaluatedItems: true,
				$dynamicRef: true,
				$recursiveRef: true,
				$defs: true,
				definitions: true
			},
			SecurityScheme: { type: ["mutualTLS"] }
		}),
		reportPlainNames,
		reportOperations,
		reportRelativeUrls
	],
	transforms: [
		lowerBooleanSchemas,
		wrapReferenceSiblings,
		dropFields({ Schema: ["nullable"] }),
		splitTypes,
		loosenUnions,
		lowerNullMembers,
		lowerTypes,
		lowerBounds,
		lowerSchemaExamples,
		lowerConst,
		lowerContent,
		lowerSchemaRules,
		lowerMultipart,
		inlineComponents("pathItems"),
		extendFields({
			Root: { webhooks: ["x-webhooks"] },
			License: { identifier: ["x-oai-license-identifier"] },
			Schema: Object.fromEntries(
				[
					"$anchor",
					"contains",
					"minContains",
					"maxContains",
					"if",
					"then",
					"else",
					"dependentSchemas",
					"patternProperties",
					"propertyNames",
					"unevaluatedProperties"
				].map((keyword) => [keyword, [`x-jsonschema-${keyword}`]])
			)
		}),
		dropFields({
			Root: ["jsonSchemaDialect"],
			Info: ["summary"],
			Schema: ["$schema", "$vocabulary", "$id", "id", "$dynamicAnchor", "$recursiveAnchor", "$comment"]
		}),
		dropEmptyPathItems,
		requireFields
	]
};
