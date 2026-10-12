import { createConfig, lintFromString } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import plugin from "../plugin.ts";

const reference = (name: string) => ({ $ref: `#/components/schemas/${name}` });

async function pointers(schemas: Record<string, unknown>) {
	const config = await createConfig({ plugins: [plugin()], rules: { "vrchat/no-nested-object": "error" } });
	const source = JSON.stringify({ openapi: "3.2.0", info: { title: "fixture", version: "1" }, paths: {}, components: { schemas } });
	const problems = await lintFromString({ source, config });
	return problems.filter((problem) => problem.ruleId === "vrchat/no-nested-object").map((problem) => problem.location[0].pointer).sort();
}

const named = { title: "Named", type: "object", properties: { id: { type: "string" } } };

describe("no-nested-object", () => {
	test("reports an object written inside another schema", async () => {
		const Parent = { title: "Parent", type: "object", properties: { child: { type: "object", properties: { id: { type: "string" } } } } };
		expect(await pointers({ Parent })).toStrictEqual(["#/components/schemas/Parent/properties/child"]);
	});

	test("accepts an object that carries its own title", async () => {
		expect(await pointers({ Named: named })).toStrictEqual([]);
	});

	test("reports a union of two types written inside another schema", async () => {
		const Parent = { title: "Parent", type: "object", properties: { child: { oneOf: [{ type: "string" }, reference("Named")] } } };
		expect(await pointers({ Parent, Named: named })).toStrictEqual(["#/components/schemas/Parent/properties/child"]);
	});

	test("counts the members of anyOf as it does oneOf", async () => {
		const Parent = { title: "Parent", type: "object", properties: { child: { anyOf: [{ type: "string" }, reference("Named")] } } };
		expect(await pointers({ Parent, Named: named })).toStrictEqual(["#/components/schemas/Parent/properties/child"]);
	});

	test("reports a union of two types that also admits null", async () => {
		const Parent = { title: "Parent", type: "object", properties: { child: { oneOf: [{ type: "string" }, { type: "null" }, reference("Named")] } } };
		expect(await pointers({ Parent, Named: named })).toStrictEqual(["#/components/schemas/Parent/properties/child"]);
	});

	test("accepts a reference made nullable", async () => {
		const Parent = { title: "Parent", type: "object", properties: { child: { anyOf: [reference("Named"), { type: "null" }] } } };
		expect(await pointers({ Parent, Named: named })).toStrictEqual([]);
	});

	test("accepts a union that carries its own title", async () => {
		const Union = { title: "Union", oneOf: [{ type: "string" }, reference("Named")] };
		expect(await pointers({ Union, Named: named })).toStrictEqual([]);
	});
});
