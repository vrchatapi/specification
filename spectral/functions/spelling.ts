import { createRulesetFunction } from "@stoplight/spectral-core";

import { check } from "../lib/typos";

const listFormat = new Intl.ListFormat("en", { style: "long", type: "disjunction" });

export const spelling = createRulesetFunction<string, unknown>({
	input: {
		type: "string",
	},
	options: null
}, async (value, options, { path, documentInventory: { findAssociatedItemForPath } }) => {
	value = value.trim();
	if (!value) return [];

	const parent = findAssociatedItemForPath(path.slice(0, -1), true);
	const enumValues = (
		typeof parent?.document.data === "object"
		&& parent?.document.data
		&& "enum" in parent?.document.data
		&& Array.isArray(parent?.document.data.enum)
		&& parent?.document.data.enum
	) as Array<string> || [];

	const issues = await check(value, enumValues);
	if (issues.length === 0) return [];

	const messages = issues
		.filter(({ text, suggestions }) => {
			// It is pedantic sometimes, suggesting to change casing or apostrophes in words.
			const cleanedSuggestions = suggestions?.map((suggestion) => suggestion.toLowerCase().replaceAll("'", "")) || [];
			if (cleanedSuggestions.includes(text.toLowerCase())) return false;

			return true;
		})
		.map((issue) => ({
			message: `Unknown word: ${issue.text}${issue.suggestions && issue.suggestions.length > 0
				? `, did you mean ${listFormat.format(issue.suggestions)}?`
				: "."}`
		}));

	return messages;
});
