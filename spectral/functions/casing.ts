import { createRulesetFunction } from "@stoplight/spectral-core";
import { camelCase, pascalCase } from "change-case";

const types = {
	camelCase,
	pascalCase
};

/**
 * Two or more capitals in a row read as an acronym. Where the run is followed by
 * a lowercase letter its last capital opens the next word instead, so `FAEmail`
 * is `FA` and `Email`.
 */
const acronyms = /[A-Z]{2,}/g;

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

	// An acronym keeps every letter, so `getCSS` is already right where `getCss`
	// is what splitting it into words gives. Renaming one costs a method name in
	// every generated client and a redirect on the docs site, which is more than
	// the spelling is worth.
	const spelled = value.replaceAll(acronyms, (run, index: number) => {
		const acronym = /[a-z]/.test(value[index + run.length] ?? "") ? run.slice(0, -1) : run;
		return pascalCase(acronym) + run.slice(acronym.length);
	});

	if (types[type](spelled) === spelled || spelled === suggestedName) return [];

	return [{
		message: `Consider renaming to ${suggestedName}.`,
	}];
});
