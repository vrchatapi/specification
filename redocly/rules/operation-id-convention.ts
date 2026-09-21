import type { Oas3Rule } from "@redocly/openapi-core";
import { camelCase, split } from "change-case";
import pluralize from "pluralize";

import { isCamelCase } from "../lib/casing.ts";

const { addUncountableRule, isPlural, plural } = pluralize;

addUncountableRule("feedback");

/**
 * An operation id is a public URL and the method name of every generated client,
 * so the prefix has to match what the operation does and the plurality has to
 * match what it returns.
 */
const prefixesByType = {
	read: ["get", "list"],
	write: ["create", "update", "patch", "delete"]
};

export const operationIdConvention: Oas3Rule = () => ({
	Operation: {
		enter: (operation, { report, location, key }) => {
			const { operationId = "", responses = {} } = operation;
			if (!operationId) return;

			const at = location.child("operationId");
			const type = key === "get" ? "read" : "write";
			const [prefix, ...name] = split(operationId);

			if (type === "read") {
				const returnsArray = Object
					.values(responses)
					.some((response) => response?.content?.["application/json"]?.schema?.type === "array");

				const last = name.at(-1) || "";

				if (returnsArray && !isPlural(last)) {
					const suggested = camelCase(`${prefix}${name.slice(0, -1).join("")}${plural(last)}`);
					report({ message: `Operation returns an array, consider renaming to ${suggested}.`, location: at });
				}
			}

			const disallowed = Object
				.entries(prefixesByType)
				.filter(([candidate]) => candidate !== type)
				.flatMap(([, prefixes]) => prefixes);

			if (disallowed.includes(prefix)) {
				const suggested = camelCase(`${prefixesByType[type][0]}${name.join("")}`);
				report({ message: `Operation name implies incorrect operation type, consider renaming to ${suggested}.`, location: at });
			}

			if (!isCamelCase(operationId))
				report({ message: `Consider renaming to ${camelCase(operationId)}.`, location: at });
		}
	}
});
