// @ts-check

import { oas3 } from "@stoplight/spectral-formats";
import { oas } from "@stoplight/spectral-rulesets";
import { camelCase, split } from "change-case";
import { addUncountableRule, isPlural, plural } from "pluralize";

import { casing } from "./functions/casing.js";

addUncountableRule("feedback");

const off = { given: "$", then: { function: () => [] } };

const prefixesByType = {
	read: ["get", "list"],
	write: ["create", "update", "patch", "delete"]
};

export default {
	...oas,

	aliases: {
		...oas.aliases,

		AnyObjectSchema: {
			targets: [
				{
					formats: [oas3],
					given: [
						// type: object
						"$..[?(@ && @.type === 'object')]"
					]
				}
			]
		}
	},

	rules: {
		...oas.rules,

		"oas3-operation-security-defined": off,
		"no-$ref-siblings": off,

		"vrc-operation-id": {
			given: "#OperationObject",
			then: [
				{
					functionOptions: {
						validateArrayOperations: false
					},
					function: ({ operationId, responses = {} }, { validateArrayOperations = true }, { path }) => {
						const [, , method] = path;
						const type = method === "get" ? "read" : "write";

						const [prefix, ...operationName] = split(operationId);

						if (validateArrayOperations && type === "read") {
							const hasArrayResponse = Object
								.values(responses)
								.some((response) => {
									const schema = response?.content?.["application/json"]?.schema;
									return schema?.type === "array";
								});

							if (hasArrayResponse) {
								const lastNameSegment = operationName.at(-1) || "";
								const suggestedName = camelCase(`list${operationName.slice(0, -1).join("")}${plural(lastNameSegment)}`);

								if (!isPlural(lastNameSegment) || prefix !== "list")
									return [{
										message: `Operation returns an array, consider renaming to "${suggestedName}".`,
										path: [...path, "operationId"],
									}];
							}
						}

						const disallowedPrefixes = Object
							.entries(prefixesByType)
							.filter(([key]) => key !== type)
							.flatMap(([, value]) => value);

						if (disallowedPrefixes.includes(prefix)) {
							const suggestedPrefix = prefixesByType[type]?.[0];
							const suggestedName = camelCase(`${suggestedPrefix}${operationName.join("")}`);

							return [{
								message: `Operation name implies incorrect operation type, consider renaming to "${suggestedName}".`,
								path: [...path, "operationId"],
							}];
						}

						return [];
					}
				},
				{
					field: "operationId",
					function: casing,
					functionOptions: {
						type: "camelCase"
					}
				}
			]
		},

		"vrc-schema-title": {
			given: [
				"#AnyObjectSchema",
				"$.components.schemas[*]",
			],
			then: [
				{
					field: "title",
					function: (value) => !value || String(value).trim() === ""
						? [{ message: "Schema object is missing a title." }]
						: []
				},
				{
					field: "title",
					function: casing,
					functionOptions: {
						type: "pascalCase"
					}
				}
			]
		},

		"vrc-description": {
			given: "$..[?(@ && @.description)]",
			then: {
				field: "description",
				function: (value) => !value || String(value).trim() === ""
					? [{ message: "Low quality description, consider adding a proper one." }]
					: []
			}
		}
	}
};
