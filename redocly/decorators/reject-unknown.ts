import type { Oas3Decorator } from "@redocly/openapi-core";

// A value the suite captures under Unknown is one the spec should describe.
export const rejectUnknown: Oas3Decorator = () => ({
	Schema: {
		leave: (schema) => {
			if (schema.title === "Unknown") schema.not = {};
		}
	}
});
