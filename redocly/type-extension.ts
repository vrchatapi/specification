import type { Plugin } from "@redocly/openapi-core";

type TypeExtension = NonNullable<Plugin["typeExtension"]>;
type Types = ReturnType<NonNullable<TypeExtension["oas3"]>>;

/**
 * The `info` extensions the `vrchat/info-extension-override` and
 * `vrchat/x-links` decorators write, so `struct` checks every bundle
 * carries them in shape. Each link is an RFC 8288 web link.
 *
 * https://redocly.com/docs/cli/custom-plugins/extended-types
 * https://www.rfc-editor.org/rfc/rfc8288#section-2
 */
function extendInfo(types: Types): Types {
	return {
		...types,
		XLinkList: { properties: {}, items: "XLink" },
		XLink: {
			properties: {
				title: { type: "string" },
				rel: { type: "string" },
				href: { type: "string" },
				type: { type: "string" }
			},
			required: ["rel", "href"]
		},
		Info: {
			...types.Info,
			properties: {
				...types.Info.properties,
				"x-agents": { type: "string" },
				"x-links": "XLinkList"
			}
		}
	};
}

/**
 * 3.2 made a response's `description` optional, and Redocly's 3.2 Response type
 * still inherits 3.1's requirement.
 *
 * https://spec.openapis.org/oas/v3.2.0#response-object
 */
function optionalResponseDescription(types: Types): Types {
	const required = types.Response.required as Array<string>;
	return { ...types, Response: { ...types.Response, required: required.filter((name) => name !== "description") } };
}

export const typeExtension: TypeExtension = {
	oas3: (types, version) => {
		const extended = extendInfo(types);
		return version === "oas3_2" ? optionalResponseDescription(extended) : extended;
	}
};
