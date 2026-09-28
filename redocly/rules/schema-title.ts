import { basename, extname } from "node:path";

import type { Oas3Rule, Oas3Visitor } from "@redocly/openapi-core";
import { pascalCase } from "change-case";

import { isPascalCase } from "../lib/casing.ts";

/**
 * Generated clients name a type after its title, so every named schema needs
 * one, spelled in PascalCase, the case every language they target uses for a
 * type. An acronym keeps its capitals, as in `APIConfig`.
 *
 * The bundle names a schema after its file, so a title that differs from the
 * filename gives one schema two names, and can give two schemas the same one.
 *
 * `NamedSchemas` hands over the `$ref` nodes rather than the files behind them,
 * and every schema here is a `$ref`, so an unresolved read finds no title on any
 * of them.
 */
export const schemaTitle: Oas3Rule = (): Array<Oas3Visitor> => [
	{
		NamedSchemas: {
			enter: (schemas, { report, location, resolve }) => {
				for (const [name, schema] of Object.entries(schemas)) {
					const { node } = resolve(schema);
					if ((node?.title ?? "").trim().length !== 0) continue;

					report({ message: "Schema must have a non-empty title.", location: location.child(name) });
				}
			}
		}
	},
	{
		Schema: {
			enter: ({ title }, { report, location }) => {
				if (title === undefined || isPascalCase(title)) return;

				report({
					message: "The title must be PascalCase.",
					suggest: [pascalCase(title)],
					location: location.child("title")
				});
			}
		}
	},
	{
		Schema: {
			enter: ({ title }, { report, location }) => {
				const filename = basename(location.source.absoluteRef, extname(location.source.absoluteRef));
				if (title === undefined || location.pointer !== "#/" || title === filename) return;

				report({
					message: `The title must match the filename, \`${filename}\`.`,
					suggest: [filename],
					location: location.child("title")
				});
			}
		}
	}
];
