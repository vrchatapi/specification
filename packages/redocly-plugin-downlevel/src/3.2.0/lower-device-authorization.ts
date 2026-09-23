import type { Node, Transform } from "../layer.ts";

/**
 * 3.2 added the OAuth 2 device authorization flow; 3.1 has no field for it. The
 * flow moves to `x-oai-deviceAuthorization`, and its `deviceAuthorizationUrl`,
 * which no 3.1 flow has, to `x-oai-deviceAuthorizationUrl`.
 *
 * https://spec.openapis.org/registry/extension/x-oai-deviceAuthorization.html
 * https://spec.openapis.org/registry/extension/x-oai-deviceAuthorizationUrl.html
 */
export const lowerDeviceAuthorization: Transform = () => ({
	OAuth2Flows: {
		leave: (flows) => {
			const flow = flows.deviceAuthorization as Node | undefined;
			if (!flow) return;

			if ("deviceAuthorizationUrl" in flow) {
				flow["x-oai-deviceAuthorizationUrl"] ??= flow.deviceAuthorizationUrl;
				delete flow.deviceAuthorizationUrl;
			}
			flows["x-oai-deviceAuthorization"] ??= flow;
			delete flows.deviceAuthorization;
		}
	}
});
