// @ts-check

import { oas3 } from "@stoplight/spectral-formats/dist/openapi";
import { oas } from "@stoplight/spectral-rulesets";

import { ruleset } from "./identity";
import { rules } from "./rules";

const excludedRules = [
	"oas3-operation-security-defined",
	"operation-singular-tag"
];

export const defaultRuleset = ruleset({
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
		...Object.fromEntries(
			Object
				.entries(oas.rules)
				.filter(([key]) => !excludedRules.includes(key) && !key.startsWith("oas2-"))
				.map(([key, { recommended, ...value }]) => [key, value])
		),
		...rules
	},
	overrides: [
		{
			files: ["openapi.yaml"],
			rules: {
				"oas3-schema": "off",
				"oas3-unused-component": "off"
			}
		}
	]
});
