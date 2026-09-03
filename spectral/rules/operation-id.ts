import { camelCase, split } from "change-case";
import { addUncountableRule, isPlural, plural } from "pluralize";

import { casing } from "../functions/casing";
import { rule } from "../identity";

addUncountableRule("feedback");

const prefixesByType = {
	read: ["get", "list"],
	write: ["create", "update", "patch", "delete"]
};

export const operationId = rule({
	severity: "hint",
	given: "#OperationObject",
	then: [
		{
			function: ({ operationId = "", responses = {} } = {}, _options, { path = [] }) => {
				const [, , method] = path;
				const type = method === "get" ? "read" : "write";

				const [prefix, ...operationName] = split(operationId);

				if (type === "read") {
					const hasArrayResponse = Object
						.values(responses)
						.some((response: any) => {
							const schema = response?.content?.["application/json"]?.schema;
							return schema?.type === "array";
						});

					const lastNameSegment = operationName.at(-1) || "";

					if (hasArrayResponse && !isPlural(lastNameSegment)) {
						const suggestedName = camelCase(`${prefix}${operationName.slice(0, -1).join("")}${plural(lastNameSegment)}`);

						return [{
							message: `Operation returns an array, consider renaming to ${suggestedName}.`,
							path: [...path, "operationId"],
						}];
					}
				}

				const disallowedPrefixes = Object
					.entries(prefixesByType)
					.filter(([key]) => key !== type)
					.flatMap(([, value]) => value);

				if (disallowedPrefixes.includes(prefix)) {
					const suggestedPrefix = prefixesByType[type]?.[0];
					const suggestedName = camelCase(`${suggestedPrefix}${operationName.join("")}`);

					return [{
						message: `Operation name implies incorrect operation type, consider renaming to ${suggestedName}.`,
						path: [...path, "operationId"],
					}];
				}

				return [];
			}
		},
		{
			field: "operationId",
			function: casing,
			functionOptions: {
				type: "camelCase"
			}
		}
	]
});
