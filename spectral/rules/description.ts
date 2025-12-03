import { rule } from "../identity";

export const description = rule({
	given: "$..description",
	then: {
		function: (description) => {
			if (description && String(description).trim().length !== 0) return [];
			return [{ message: "Cannot be empty." }];
		}
	}
});
