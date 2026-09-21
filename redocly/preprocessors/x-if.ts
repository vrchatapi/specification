import type { Oas3Preprocessor } from "@redocly/openapi-core";

interface Options {
	defines?: Array<string>;
}

interface Conditional {
	when: string;
	then: Record<string, unknown>;
	else?: Record<string, unknown>;
}

/**
 * Replaces an `x-if` with its `then` branch where the caller defines `when`, and
 * with its `else` branch otherwise, so one description can carry both the shape
 * the published bundles take and the shape the test bundle needs.
 */
export const xIf: Oas3Preprocessor = ({ defines = [] }: Options) => ({
	SpecExtension: {
		skip: (_, key) => key !== "x-if",
		enter: (value, { parent, report, location }) => {
			if (typeof value !== "object" || !value)
				return report({ message: "Must be an object." });

			const { when, then, else: fallback } = value as Conditional;

			if (typeof when !== "string" || !when)
				return report({ message: "Cannot be empty.", location: location.child("when") });

			if (typeof then !== "object" || !then)
				return report({ message: "Must be an object.", location: location.child("then") });

			if (fallback !== undefined && (typeof fallback !== "object" || !fallback))
				return report({ message: "Must be an object.", location: location.child("else") });

			Object.assign(parent, {
				"x-if": undefined,
				...(defines.includes(when) ? then : fallback)
			});
		}
	}
});
