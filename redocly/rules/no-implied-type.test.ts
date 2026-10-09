import { createConfig, lintFromString } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import plugin from "../plugin.ts";

async function messages(schemas: Record<string, unknown>) {
	const config = await createConfig({ plugins: [plugin()], rules: { "vrchat/no-implied-type": "error" } });
	const source = JSON.stringify({ openapi: "3.2.0", info: { title: "fixture", version: "1" }, paths: {}, components: { schemas } });
	const problems = await lintFromString({ source, config });
	return problems.filter((problem) => problem.ruleId === "vrchat/no-implied-type").map((problem) => `${problem.location[0].pointer} ${problem.message}`);
}

describe("no-implied-type", () => {
	test("reports a type that an enum or const already implies", async () => {
		expect(
			await messages({
				Color: { title: "Color", type: "string", enum: ["red", "green"] },
				Status: { title: "Status", type: ["string", "null"], enum: ["active", null] },
				Circle: { title: "Circle", type: "object", properties: { kind: { type: "string", const: "circle" } } }
			})
		).toStrictEqual([
			"#/components/schemas/Color/type `enum` implies this `type`. Remove it; the bundles write it back.",
			"#/components/schemas/Status/type `enum` implies this `type`. Remove it; the bundles write it back.",
			"#/components/schemas/Circle/properties/kind/type `const` implies this `type`. Remove it; the bundles write it back."
		]);
	});

	test("leaves a type the values do not imply, and a type without enum or const", async () => {
		expect(
			await messages({
				Count: { title: "Count", type: "number", enum: [1, 2] },
				Name: { title: "Name", type: "string" },
				Color: { title: "Color", enum: ["red"] }
			})
		).toStrictEqual([]);
	});
});
