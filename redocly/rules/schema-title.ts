import type { Oas3Rule } from "@redocly/openapi-core";

/**
 * Generated clients name a type after its title, so a named schema without one
 * leaves each language to invent its own name.
 *
 * `NamedSchemas` hands over the `$ref` nodes rather than the files behind them,
 * and every schema here is a `$ref`, so an unresolved read finds no title on any
 * of them.
 */
export const schemaTitle: Oas3Rule = () => ({
	NamedSchemas: {
		enter: (schemas, { report, location, resolve }) => {
			for (const [name, schema] of Object.entries(schemas)) {
				const { node } = resolve(schema);
				if ((node?.title ?? "").trim().length !== 0) continue;

				report({ message: "Schema must have a non-empty title.", location: location.child(name) });
			}
		}
	}
});
