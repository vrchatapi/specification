import type { CSpellSettings, Document } from "cspell-lib";
import { spellCheckDocument } from "cspell-lib";

const words = [
	"VRChat",
	"VRC",
	"Tilia",
	"8JoV9XEdpo",
	"Tupper",
	"cooldown",
	"favorited",
	"vrchatplus",
	"unban",
	"unmute"
];

const suggestWords = [
	"favourited: favorited"
];

const config: CSpellSettings = {
	words,

	suggestWords,
	numSuggestions: 3,

	noConfigSearch: true,
	readonly: true,
	validateDirectives: false,

	languageId: "markdown",
	enabledLanguageIds: ["markdown"],

	patterns: [
		{
			name: "ids",
			pattern: /\w{1,4}_[\w-]{36}/g
		},
		{
			name: "extensions",
			pattern: /\.\w+/g
		}
	],
	ignoreRegExpList: ["ids", "extensions"],
	ignoreRandomStrings: true
};

const options = {
	generateSuggestions: true,
	...config
};

export async function check(value: string, userWords: Array<string> = []) {
	if (!value?.trim()) return [];

	const document: Document = { text: value, uri: "value.md" };

	// This is stupidly slow, might be worth looking into improving performance later.
	const { issues = [] } = await spellCheckDocument(document, options, { ...config, userWords });

	return issues;
}
