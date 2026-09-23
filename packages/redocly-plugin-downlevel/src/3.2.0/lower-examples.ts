import type { Transform } from "../layer.ts";

/**
 * 3.2 splits an example's `value` into `dataValue`, the data, and
 * `serializedValue`, its serialized form. 3.1 has only `value`, which takes the
 * data where there is some and the serialized string otherwise; the serialized
 * form also goes to `x-oai-serializedValue`, which keeps it apart from data.
 *
 * https://spec.openapis.org/oas/v3.2.0#example-object
 * https://spec.openapis.org/registry/extension/x-oai-serializedValue.html
 */
export const lowerExamples: Transform = () => ({
	Example: {
		leave: (node) => {
			if ("dataValue" in node) node.value = node.dataValue;
			else if ("serializedValue" in node) node.value = node.serializedValue;
			if ("serializedValue" in node) node["x-oai-serializedValue"] ??= node.serializedValue;

			delete node.dataValue;
			delete node.serializedValue;
		}
	}
});
