import type { Plugin } from "@redocly/openapi-core";

export default function myLocalPlugin(): Plugin {
	return {
		id: "vrchat",
		decorators: {
			oas3: {
				/**
				 * Closes every object schema that lists properties, so a response
				 * carrying a field the description does not mention fails validation.
				 *
				 * Only for the conformance bundle. An open schema legally permits any
				 * extra property, which is correct for consumers but makes undocumented
				 * fields undetectable.
				 *
				 * Schemas without `properties` are left alone — those are deliberately
				 * free-form (`defaultContentSettings`, `appleDetails`) and closing them
				 * would report their entire contents as drift.
				 *
				 * `unevaluatedProperties` is a JSON Schema 2019-09 keyword and is not
				 * valid in this description's OpenAPI 3.0.3 dialect. It works because
				 * `redocly drift` validates with Ajv; a validator that only knows 3.0
				 * ignores it and silently reports zero drift. Safe only while the
				 * `conformance` bundle stays unpublished and drift-only.
				 */
				"close-schemas": () => ({
					SchemaProperties: {
						leave: (_, { parent }) => {
							if (parent.type !== "object" || parent.additionalProperties !== undefined) return;
							if (parent.unevaluatedProperties !== undefined) return;

							// `unevaluatedProperties`, not `additionalProperties`: inside a
							// `oneOf` branch the latter judges the whole object, so a response
							// matching one branch fails every other branch once per field.
							// `/auth/user` produced 89 phantom findings that way, including for
							// properties the description does define.
							parent.unevaluatedProperties = false;
						}
					}
				}),
			},
		},
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
