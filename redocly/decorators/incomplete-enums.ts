import type { Oas3Decorator } from "@redocly/openapi-core";

// The suite fails on a value the set lacks; clients stay open to it.
export const incompleteEnums: Oas3Decorator = ({ close = false }: { close?: boolean }) => ({
	Schema: {
		leave: (schema) => {
			if (schema["x-incomplete"] !== true || !Array.isArray(schema.enum)) return;
			delete schema["x-incomplete"];
			if (close) return;
			schema.examples ??= schema.enum;
			delete schema.enum;
		}
	}
});
