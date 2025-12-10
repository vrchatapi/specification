import type { Plugin } from "@redocly/openapi-core";

export default function myLocalPlugin(): Plugin {
	return {
		id: "vrchat",
		preprocessors: {
			oas3: {
				"x-if": ({ defines = [] }: { defines?: Array<string> }) => {
					return {
						SpecExtension: {
							skip: (_, key) => key !== "x-if",
							enter: (value, { parent, report, location }) => {
								if (typeof value !== "object" || !value)
									return report({ message: "Must be an object." });

								const { when, then, else: fallback } = value as { when: string; then: Record<string, unknown>; else: Record<string, unknown> };

								if (typeof when !== "string" || !when)
									return report({ message: "Cannot be empty.", location: location.child("when") });

								if (typeof then !== "object" || !then)
									return report({ message: "Must be an object.", location: location.child("then") });

								if (fallback !== undefined && (typeof fallback !== "object" || !fallback))
									return report({ message: "Must be an object.", location: location.child("else") });

								Object.assign(parent, {
									"x-if": undefined,
									...(defines.includes(when)
										? then
										: fallback)
								});
							}
						}
					};
				},
			},
		},
	};
}
