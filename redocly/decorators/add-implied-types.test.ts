import { bundleFromString, createConfig } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import plugin from "../plugin.ts";

async function bundle(schemas: Record<string, unknown>) {
	const config = await createConfig({ plugins: [plugin()], decorators: { "vrchat/add-implied-types": "on" } });
	const source = JSON.stringify({ openapi: "3.2.0", info: { title: "fixture", version: "1" }, paths: {}, components: { schemas } });
	return (await bundleFromString({ source, config })).bundle.parsed.components.schemas as Record<string, any>;
}

describe("add-implied-types", () => {
	test("gives an enum or const the type its values imply, where the key order puts it", async () => {
		const schemas = await bundle({
			Color: { title: "Color", description: "A color.", enum: ["red", "green"], examples: ["red"] },
			Circle: { title: "Circle", type: "object", properties: { kind: { const: "circle" }, size: { enum: [1, 2] } } }
		});
		expect(schemas.Color).toStrictEqual({ title: "Color", type: "string", description: "A color.", enum: ["red", "green"], examples: ["red"] });
		expect(Object.keys(schemas.Color)).toStrictEqual(["title", "type", "description", "enum", "examples"]);
		expect(schemas.Circle.properties).toStrictEqual({ kind: { type: "string", const: "circle" }, size: { type: "integer", enum: [1, 2] } });
	});

	test("lists every type the values carry, null last, and widens integers mixed with other numbers", async () => {
		const schemas = await bundle({
			Status: { title: "Status", enum: ["active", null] },
			Ratio: { title: "Ratio", enum: [1, 1.5] },
			Mixed: { title: "Mixed", enum: [true, "yes", null] }
		});
		expect(schemas.Status).toStrictEqual({ title: "Status", type: ["string", "null"], enum: ["active", null] });
		expect(schemas.Ratio).toStrictEqual({ title: "Ratio", type: "number", enum: [1, 1.5] });
		expect(schemas.Mixed).toStrictEqual({ title: "Mixed", type: ["boolean", "string", "null"], enum: [true, "yes", null] });
	});

	test("leaves a type already written, and a schema without enum or const", async () => {
		const schemas = await bundle({
			Count: { title: "Count", type: "number", enum: [1, 2] },
			Region: { title: "Region", anyOf: [{ $ref: "#/components/schemas/Count" }, { const: "unknown" }] },
			Name: { title: "Name", type: "string" }
		});
		expect(schemas.Count).toStrictEqual({ title: "Count", type: "number", enum: [1, 2] });
		expect(schemas.Region).toStrictEqual({ title: "Region", anyOf: [{ $ref: "#/components/schemas/Count" }, { type: "string", const: "unknown" }] });
		expect(schemas.Name).toStrictEqual({ title: "Name", type: "string" });
	});
});
