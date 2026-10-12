import { bundleFromString, createConfig } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import plugin from "../plugin.ts";

async function bundle(schemas: Record<string, unknown>) {
	const config = await createConfig({ plugins: [plugin()], decorators: { "vrchat/reject-unknown": "on" } });
	const source = JSON.stringify({ openapi: "3.2.0", info: { title: "fixture", version: "1" }, paths: {}, components: { schemas } });
	return (await bundleFromString({ source, config })).bundle.parsed.components.schemas as Record<string, any>;
}

const thing = { title: "Thing", type: "object", properties: { value: { $ref: "#/components/schemas/Unknown" } } };

describe("reject-unknown", () => {
	test("makes Unknown reject every value", async () => {
		const schemas = await bundle({ Unknown: { title: "Unknown", description: "Not yet described." }, Thing: thing });
		expect(schemas.Unknown).toStrictEqual({ title: "Unknown", description: "Not yet described.", not: {} });
	});

	test("finds Unknown where no component names it", async () => {
		const schemas = await bundle({ Thing: { title: "Thing", type: "object", properties: { value: { title: "Unknown" } } } });
		expect(schemas.Thing.properties.value).toStrictEqual({ title: "Unknown", not: {} });
	});

	test("leaves the schemas that reference Unknown alone", async () => {
		const schemas = await bundle({ Unknown: { title: "Unknown" }, Thing: thing });
		expect(schemas.Thing).toStrictEqual(thing);
	});

	test("leaves a schema of any other title alone", async () => {
		const schemas = await bundle({ Unknowns: { title: "Unknowns" } });
		expect(schemas.Unknowns).toStrictEqual({ title: "Unknowns" });
	});
});
