import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { escapePointerFragment, parseYaml, Source } from "@redocly/openapi-core";
import type { Oas3Rule } from "@redocly/openapi-core";

// A path its file defines but `paths` leaves out never reaches the bundle.
export const noUnlistedPaths: Oas3Rule = () => ({
	Paths: {
		enter: (paths, { report, location }) => {
			const base = dirname(location.source.absoluteRef);
			const listed = new Set(Object.keys(paths));
			const directories = new Set(
				Object.values(paths)
					.map((item) => (item as { $ref?: string }).$ref?.split("#")[0])
					.filter((file): file is string => Boolean(file))
					.map((file) => dirname(resolve(base, file)))
			);

			for (const directory of directories) {
				for (const name of readdirSync(directory).filter((file) => file.endsWith(".yaml")).sort()) {
					const file = join(directory, name);
					const body = readFileSync(file, "utf8");
					const defined = Object.keys((parseYaml(body) as { paths?: object }).paths ?? {});
					for (const path of defined.filter((path) => !listed.has(path))) {
						report({
							message: `\`${path}\` is not listed in \`paths\`, so it never reaches the bundle.`,
							location: { source: new Source(file, body), pointer: `#/paths/${escapePointerFragment(path)}`, reportOnKey: true }
						});
					}
				}
			}
		}
	}
});
