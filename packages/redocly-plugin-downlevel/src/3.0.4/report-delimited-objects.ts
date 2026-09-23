import type { Transform } from "../layer.ts";

/**
 * 3.0.4 lets `spaceDelimited` and `pipeDelimited` serialize objects; 3.0.3's
 * style table allows them for arrays only.
 *
 * https://spec.openapis.org/oas/v3.0.4#style-values
 */
export const reportDelimitedObjects: Transform = ({ version }) => ({
	Parameter: {
		enter: (parameter, { report, location }) => {
			const style = parameter.style;
			if ((style === "spaceDelimited" || style === "pipeDelimited") && (parameter.schema as Record<string, unknown> | undefined)?.type === "object")
				report({ message: `OpenAPI ${version} allows \`style: ${style}\` only for arrays.`, location: location.child("style") });
		}
	}
});
