import process from "node:process";

import type { Oas3Decorator } from "@redocly/openapi-core";

/**
 * Sets `info.version` from the environment variable `environmentVariable`
 * names, `version` by default, so a nightly build carries its own number.
 */
export const versionOverride: Oas3Decorator = ({ environmentVariable = "version" }) => ({
	Info: {
		leave: (info, { report, location }) => {
			const version = process.env[environmentVariable];
			if (!version) {
				report({
					message: `\`${environmentVariable}\` is not set, so \`info.version\` stays \`${info.version}\`.`,
					location: location.child("version"),
					forceSeverity: "warn"
				});
				return;
			}

			info.version = version;
		}
	}
});
