import { createRulesetFunction } from "@stoplight/spectral-core";
import { camelCase, pascalCase } from "change-case";

const types = {
	camelCase,
	pascalCase
};

export const casing = createRulesetFunction<string, { type: keyof typeof types }>({
	input: {
		type: "string",
	},
	options: {
		type: "object",
		properties: {
			type: {
				enum: Object.keys(types),
			}
		},
	}
}, (value, { type }) => {
	const suggestedName = types[type](value);
	if (value === suggestedName) return [];

	return [{
		message: `Consider renaming to ${suggestedName}.`,
	}];
});
