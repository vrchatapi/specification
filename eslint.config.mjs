import { configure } from "@ariesclark/eslint-config";
import cspell from "@cspell/eslint-plugin";

export default configure({
	type: "app",
	react: false,
	yaml: true,
	ignores: ["packages/*/fixtures/**", "packages/*/dist/**"],
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
				pathPattern: "^(?!.*x-enum-varnames).*",
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
}, {
	files: ["openapi/**/*.yaml"],
	plugins: { "@cspell": cspell },
	rules: {
		"@cspell/spellchecker": [
			"warn",
			{
				configFile: new URL("./cspell.config.yaml", import.meta.url).toString(),
				// `checkScope` matches a node type and the key it was reached by, so
				// there is no way to check only the prose fields. Keys and sequence
				// entries are off because a path segment and an enum value are the
				// API's vocabulary rather than English; values carry the descriptions.
				checkScope: [
					["YAMLPair[key] YAMLScalar", false],
					["YAMLPair[value] YAMLScalar", true],
					["YAMLSequence[entries] YAMLScalar", false]
				]
			}
		]
	}
});
