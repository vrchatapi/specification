import type { Plugin } from "@redocly/openapi-core";

/**
 * 3.2 made a response's `description` optional, and Redocly's 3.2 Response type
 * still inherits 3.1's requirement.
 *
 * https://spec.openapis.org/oas/v3.2.0#response-object
 */
export const typeExtension: NonNullable<Plugin["typeExtension"]> = {
	oas3: (types, version) => {
		if (version !== "oas3_2") return types;

		const required = types.Response.required as Array<string>;
		return { ...types, Response: { ...types.Response, required: required.filter((name) => name !== "description") } };
	}
};
