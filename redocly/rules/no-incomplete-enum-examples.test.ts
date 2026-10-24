import { createConfig, lintFromString } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import plugin from "../plugin.ts";

async function messages(schemas: Record<string, unknown>) {
	const config = await createConfig({ plugins: [plugin()], rules: { "vrchat/no-incomplete-enum-examples": "error" } });
	const source = JSON.stringify({ openapi: "3.2.0", info: { title: "fixture", version: "1" }, paths: {}, components: { schemas } });
	const problems = await lintFromString({ source, config });
	return problems.filter((problem) => problem.ruleId === "vrchat/no-incomplete-enum-examples").map((problem) => `${problem.location[0].pointer} ${problem.message}`);
}

describe("no-incomplete-enum-examples", () => {
	test("reports examples beside an incomplete enum", async () => {
		expect(await messages({ Color: { title: "Color", type: "string", enum: ["red", "green"], examples: ["red"], "x-incomplete": true } })).toStrictEqual([
			"#/components/schemas/Color/examples Remove `examples`: the bundles publish an incomplete enum's values as its examples."
		]);
	});

	test("leaves an incomplete enum without examples", async () => {
		expect(await messages({ Color: { title: "Color", type: "string", enum: ["red", "green"], "x-incomplete": true } })).toStrictEqual([]);
	});

	test("leaves examples beside a complete enum, or without one", async () => {
		expect(
			await messages({
				Shade: { title: "Shade", type: "string", enum: ["dark", "light"], examples: ["dark"] },
				Name: { title: "Name", type: "string", examples: ["aries"] }
			})
		).toStrictEqual([]);
	});
});
