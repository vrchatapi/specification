import { extname } from "node:path";

import type { Oas3Decorator } from "@redocly/openapi-core";

/**
 * Links each published document through `x-links` to the latest release, the
 * latest nightly, and every OpenAPI version and format the release named by
 * `info.version` publishes its family in.
 *
 * `documents` maps each family's evergreen file name, without its extension, to
 * the template its versioned ones follow. The document being built is named by
 * its API alias, which is its output file name, since Redocly hands a decorator
 * its API's configuration without `output`.
 *
 * https://github.com/Redocly/redocly-cli/blob/main/packages/core/src/config/config.ts
 */
export const xLinks: Oas3Decorator = ({ releases, formats, versions, documents }) => ({
	Info: {
		leave: (info, { report, location, config }) => {
			const file = config?._alias ?? "";
			const extension = extname(file);
			const stem = file.slice(0, file.length - extension.length);

			const family = Object.entries(documents as Record<string, string>).find(([evergreen, template]) =>
				stem === evergreen || (versions as Array<string>).some((version) => template.replace("{version}", version) === stem));

			if (!family) {
				report({ message: `\`x-links\` has no family in \`documents\` for the API \`${file}\`.`, location: location.child("x-links"), forceSeverity: "error" });
				return;
			}

			const [evergreen, template] = family;
			const type = (format: string) => `application/openapi+${format}`;
			const base = `${releases}/download/v${info.version}`;

			Object.assign(info, { "x-links": [
				{ title: "Latest (stable)", rel: "latest-version", href: `${releases}/latest/download/${file}`, type: type(extension.slice(1)) },
				{ title: "Latest (nightly)", rel: "working-copy", href: `${releases}/download/nightly/${file}`, type: type(extension.slice(1)) },
				...[
					[evergreen, "OpenAPI (evergreen)"],
					...(versions as Array<string>).map((version) => [template.replace("{version}", version), `OpenAPI ${version}`])
				].flatMap(([name, title]) => (formats as Array<string>).map((format) => ({
					title: `${title}, ${format.toUpperCase()}`,
					rel: "alternate",
					href: `${base}/${name}.${format}`,
					type: type(format)
				})))
			] });
		}
	}
});
