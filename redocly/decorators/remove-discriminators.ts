import type { Oas3Decorator } from "@redocly/openapi-core";

/**
 * The suite's Ajv cannot compile a `defaultMapping` fallback, and a discriminator never changes what a `oneOf` accepts.
 * https://ajv.js.org/json-schema.html#discriminator
 */
export const removeDiscriminators: Oas3Decorator = () => ({
	Schema: {
		leave: (schema) => {
			delete (schema as Record<string, unknown>).discriminator;
		}
	}
});
