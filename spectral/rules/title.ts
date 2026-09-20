import { rule } from "../identity";

export const title = rule({
	given: "$.components.schemas[*]",
	then: {
		field: "title",
		function: (value) => {
			if (value && String(value).trim().length !== 0) return [];
			return [{ message: "Schema must have a non-empty title." }];
		}
	}
});
