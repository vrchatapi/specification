import { createConfig, lintFromString } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import plugin from "../plugin.ts";

const reference = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const member = (value: string) => ({ type: "object", properties: { kind: { type: "string", const: value } }, required: ["kind"] });

async function messages(schemas: Record<string, unknown>) {
	const config = await createConfig({ plugins: [plugin()], rules: { "vrchat/consistent-discriminator": "error" } });
	const source = JSON.stringify({ openapi: "3.2.0", info: { title: "fixture", version: "1" }, paths: {}, components: { schemas } });
	const problems = await lintFromString({ source, config });
	return problems.filter((problem) => problem.ruleId === "vrchat/consistent-discriminator").map((problem) => problem.message).sort();
}

function union(overrides: Record<string, unknown> = {}) {
	return {
		discriminator: { propertyName: "kind", mapping: { a: "#/components/schemas/A", b: "#/components/schemas/B" }, defaultMapping: "#/components/schemas/Other" },
		oneOf: [reference("A"), reference("B"), reference("Other")],
		...overrides
	};
}
const other = (values: Array<string>) => ({ type: "object", properties: { kind: { type: "string", not: { enum: values } } }, required: ["kind"] });

describe("consistent-discriminator", () => {
	test("accepts a union whose four lists agree", async () => {
		expect(await messages({ Union: union(), A: member("a"), B: member("b"), Other: other(["a", "b"]) })).toStrictEqual([]);
	});

	test("reports a member the mapping does not name", async () => {
		const schemas = { Union: union({ discriminator: { propertyName: "kind", mapping: { a: "#/components/schemas/A" }, defaultMapping: "#/components/schemas/Other" } }), A: member("a"), B: member("b"), Other: other(["a"]) };
		expect(await messages(schemas)).toStrictEqual(["`B` is in `oneOf` but `mapping` does not name it."]);
	});

	test("reports a mapping entry missing from oneOf", async () => {
		const schemas = { Union: union({ oneOf: [reference("A"), reference("Other")] }), A: member("a"), B: member("b"), Other: other(["a", "b"]) };
		expect(await messages(schemas)).toStrictEqual(["`mapping` names `B`, which is not in `oneOf`."]);
	});

	test("reports a member whose const differs from its mapping key", async () => {
		expect(await messages({ Union: union(), A: member("a"), B: member("x"), Other: other(["a", "b"]) })).toStrictEqual(["`B` is mapped from `b` but its `kind` is `x`."]);
	});

	test("reports a fallback that excludes the wrong values", async () => {
		expect(await messages({ Union: union(), A: member("a"), B: member("b"), Other: other(["a", "c"]) })).toStrictEqual(["`Other` must exclude exactly the mapped values: missing `b`, extra `c`."]);
	});

	test("reports a fallback that is not the last member of oneOf", async () => {
		const schemas = { Union: union({ oneOf: [reference("A"), reference("Other"), reference("B")] }), A: member("a"), B: member("b"), Other: other(["a", "b"]) };
		expect(await messages(schemas)).toStrictEqual(["`Other` is the `defaultMapping` fallback, so it must be the last member of `oneOf`."]);
	});

	test("finds the const on a member that reaches it through allOf", async () => {
		const Base = { type: "object", properties: { id: { type: "string" } } };
		const B = { allOf: [reference("Base")], ...member("b") };
		expect(await messages({ Union: union(), A: member("a"), B, Base, Other: other(["a", "b"]) })).toStrictEqual([]);
	});

	test("checks a union without a fallback against its mapping only", async () => {
		const schemas = { Union: { discriminator: { propertyName: "kind", mapping: { a: "#/components/schemas/A" } }, oneOf: [reference("A"), reference("B")] }, A: member("a"), B: member("b") };
		expect(await messages(schemas)).toStrictEqual(["`B` is in `oneOf` but `mapping` does not name it."]);
	});
});
