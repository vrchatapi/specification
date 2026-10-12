import type { Oas3Decorator } from "@redocly/openapi-core";

// The suite fails on a value the set lacks; clients stay open to it.
export const unknownEnums: Oas3Decorator = ({ close = false }: { close?: boolean }) => ({
	Schema: {
		leave: (schema) => {
			const values = schema["x-unknown-enum"];
			if (!Array.isArray(values)) return;
			delete schema["x-unknown-enum"];
			if (close) schema.enum = [...values];
			else schema.examples ??= [...values];
		}
	}
});
