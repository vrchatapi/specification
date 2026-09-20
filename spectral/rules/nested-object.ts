import { rule } from "../identity";

/**
 * A schema in its own file carries a title taken from that file, so an object
 * without one is still nested inside another schema. Adding a title in place
 * would satisfy that test without moving the object, which is why the message
 * asks for the file rather than the title.
 */
const reported = new WeakMap<object, WeakSet<object>>();

export const nestedObject = rule({
	given: "#AnyObjectSchema",
	then: {
		function: (value: any, _options: unknown, { documentInventory }: any) => {
			if (value?.title && String(value.title).trim().length !== 0) return [];

			const seen = reported.get(documentInventory) ?? new WeakSet<object>();
			reported.set(documentInventory, seen);

			if (seen.has(value)) return [];
			seen.add(value);

			return [{ message: "Object schemas belong in their own file under components/schemas, reached by $ref." }];
		}
	}
});
