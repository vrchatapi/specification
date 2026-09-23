import type { Transform } from "../layer.ts";

/**
 * 3.2 made a response's `description` optional; 3.1 requires one.
 *
 * https://spec.openapis.org/oas/v3.2.0#response-object
 * https://spec.openapis.org/oas/v3.1.2#response-object
 */
export const describeResponses: Transform = () => ({
	Response: {
		leave: (response) => {
			response.description ??= "";
		}
	}
});
