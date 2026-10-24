import { createConfig, lintFromString } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import plugin from "../plugin.ts";

async function messages(schemas: Record<string, unknown>) {
	const config = await createConfig({ plugins: [plugin()], rules: { "vrchat/no-single-value-enum": "error" } });
	const source = JSON.stringify({ openapi: "3.2.0", info: { title: "fixture", version: "1" }, paths: {}, components: { schemas } });
	const problems = await lintFromString({ source, config });
	return problems.filter((problem) => problem.ruleId === "vrchat/no-single-value-enum").map((problem) => `${problem.location[0].pointer} ${problem.message}`);
}

describe("no-single-value-enum", () => {
	test("reports an enum of one value", async () => {
		expect(await messages({ Kind: { title: "Kind", enum: ["circle"] } })).toStrictEqual([
			"#/components/schemas/Kind/enum Use `const`: an `enum` of one value is a `const`."
		]);
	});

	test("leaves an incomplete enum of one value, the only value seen so far", async () => {
		expect(await messages({ Version: { title: "Version", type: "integer", enum: [1], "x-incomplete": true } })).toStrictEqual([]);
	});

	test("leaves an enum of several values", async () => {
		expect(await messages({ Color: { title: "Color", enum: ["red", "green"] } })).toStrictEqual([]);
	});
});
