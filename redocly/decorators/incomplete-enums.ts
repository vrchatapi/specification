import type { Oas3Decorator } from "@redocly/openapi-core";

// The suite fails on a value the set lacks; clients stay open to it, and `x-incomplete` tells them the values are a partial list.
export const incompleteEnums: Oas3Decorator = ({ close = false }: { close?: boolean }) => ({
	Schema: {
		leave: (schema) => {
			if (close || schema["x-incomplete"] !== true || !Array.isArray(schema.enum)) return;
			schema.examples = schema.enum;
			delete schema.enum;
		}
	}
});
