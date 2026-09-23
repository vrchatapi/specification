import type { Node, Transform } from "../layer.ts";

const methods = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

/**
 * 3.1 excuses a path item with no operations from declaring its template's path
 * parameters; 3.0 requires every template expression to have one. Such a path
 * item describes nothing a client can call, so it goes.
 *
 * https://spec.openapis.org/oas/v3.1.1#path-templating
 */
export const dropEmptyPathItems: Transform = () => ({
	Paths: {
		leave: (paths) => {
			for (const [path, item] of Object.entries(paths as Record<string, Node>)) {
				if (!item || typeof item !== "object" || item.$ref !== undefined) continue;
				if (methods.some((method) => item[method] !== undefined)) continue;

				const declared = new Set(
					((item.parameters ?? []) as Array<Node>).filter((parameter) => parameter.in === "path").map((parameter) => parameter.name)
				);
				const templated = [...path.matchAll(/\{([^}]+)\}/g)].map(([, name]) => name);
				if (templated.some((name) => !declared.has(name))) delete (paths as Record<string, Node>)[path];
			}
		}
	}
});
