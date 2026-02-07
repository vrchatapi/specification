import { configure } from "@ariesclark/eslint-config";

export default configure({
	type: "app",
	react: false,
	yaml: true,
	rules: {
		"unicorn/prevent-abbreviations": "off",
	}
}, {
	files: [
		"openapi/**/*.yaml",
	],
	rules: {
		"yaml/sort-keys": [
			"error",
			{
				pathPattern: ".*x-if.*",
				order: [
					"when",
					"then",
					"else"
				]
			},
			{
				pathPattern: ".*",
				hasProperties: [
					"openapi"
				],
				order: [
					"openapi",
					"info",
					"servers",
					"paths",
					"components",
					"security",
					"tags",
					"externalDocs"
				]
			},
			{
				pathPattern: ".*",
				hasProperties: [
					"operationId"
				],
				order: [
					"operationId",
					"deprecated",
					"summary",
					"description",
					"tags",
					"parameters",
					"requestBody",
					"security",
					"responses",
				]
			},
			{
				pathPattern: "^\.*$",
				hasProperties: [
					"parameters"
				],
				order: [
					"parameters",
					"get",
					"put",
					"post",
					"delete",
					"options",
					"head",
					"patch",
					"trace",
					{
						order: {
							type: "asc"
						}
					}
				]
			},
			{
				pathPattern: "^properties$",
				order: [
					{
						order: {
							type: "asc"
						}
					}
				]
			},
			{
				pathPattern: ".*",
				order: [
					"id",
					"title",
					"name",
					"deprecated",
					"$ref",
					"type",
					"description",
					"nullable",
					"additionalProperties",
					"properties",
					"required",
					"enum",
					"default",
					"example",
					{
						order: {
							type: "asc"
						}
					}
				]
			}
		],
		"yaml/sort-sequence-values": [
			"error",
			{
				"pathPattern": "^(?!.*x-enum-varnames).*",
				order: [
					{
						order: {
							type: "asc"
						}
					}
				]
			}
		]
	}
}, {
	files: ["openapi/openapi.yaml"],
	rules: {
		"yaml/sort-keys": "off"
	}
});
