import { spelling } from "../functions/spelling.js";
import { rule } from "../identity";

export const typos = rule({
	severity: "hint",
	given: [
		"$..title",
		"$..summary",
		"$..description",
		// "$..example",
		"$..examples"
	],
	then: [
		{
			function: spelling
		},
		{
			field: "@key",
			function: spelling
		}
	]
});
