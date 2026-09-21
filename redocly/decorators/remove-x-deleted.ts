import type { Oas3Decorator } from "@redocly/openapi-core";

/**
 * Drops every operation carrying `x-deleted`, and any path item left without an
 * operation, from the published bundles. The test bundle keeps them so the suite
 * goes on calling the route and a revival shows up as a failing `not-found`
 * workflow.
 */
export const removeXDeleted: Oas3Decorator = () => {
	// Operations leave before the path item holding them, so by the time one is
	// visited this knows whether any of its own survived.
	const populated = new WeakSet<object>();

	return {
		Operation: {
			leave: (operation, { parent, key }) => {
				if ((operation as Record<string, unknown>)["x-deleted"]) {
					delete (parent as Record<string, unknown>)[key];
					return;
				}

				populated.add(parent as object);
			}
		},
		PathItem: {
			leave: (pathItem, { parent, key }) => {
				if (!populated.has(pathItem as object)) delete (parent as Record<string, unknown>)[key];
			}
		}
	};
};
