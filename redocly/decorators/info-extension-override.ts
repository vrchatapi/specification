import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

import type { Oas3Decorator } from "@redocly/openapi-core";

/**
 * Sets an extension on `info` from a Markdown file, as Redocly's
 * `info-description-override` does for `description`, so long prose such as the
 * `x-agents` guidance lives in a file of its own.
 *
 * https://redocly.com/docs/cli/decorators/info-description-override
 */
export const infoExtensionOverride: Oas3Decorator = ({ name, filePath }) => ({
	Info: {
		leave: (info, { report, location, config }) => {
			if (typeof name !== "string" || !name.startsWith("x-") || typeof filePath !== "string")
				throw new Error("`info-extension-override` needs an extension `name` starting with `x-` and a `filePath`.");

			try {
				const base = config?.configPath ? dirname(config.configPath) : process.cwd();
				Object.assign(info, { [name]: readFileSync(resolve(base, filePath), "utf8").trimEnd() });
			}
			catch (reason) {
				report({ message: `Cannot read \`${filePath}\` for \`info.${name}\`: ${(reason as Error).message}`, location: location.child(name) });
			}
		}
	}
});
