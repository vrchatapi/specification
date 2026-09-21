import type { Oas3Rule } from "@redocly/openapi-core";

/**
 * A `description` left empty reads as a field nobody has written yet, and every
 * generated client carries it through as a blank doc comment.
 */
export const noEmptyDescription: Oas3Rule = () => ({
	any: {
		enter: (node, { report, location }) => {
			if (typeof node !== "object" || node === null || !("description" in node)) return;

			const description = (node as { description: unknown }).description;
			if (typeof description !== "string" || description.trim().length !== 0) return;

			report({ message: "Cannot be empty.", location: location.child("description") });
		}
	}
});
