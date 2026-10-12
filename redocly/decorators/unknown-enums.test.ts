import { bundleFromString, createConfig } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import plugin from "../plugin.ts";

async function bundle(schemas: Record<string, unknown>, options: Record<string, unknown> = {}) {
	const config = await createConfig({ plugins: [plugin()], decorators: { "vrchat/unknown-enums": { severity: "on", ...options } } });
	const source = JSON.stringify({ openapi: "3.2.0", info: { title: "fixture", version: "1" }, paths: {}, components: { schemas } });
	return (await bundleFromString({ source, config })).bundle.parsed.components.schemas as Record<string, unknown>;
}

const Color = { title: "Color", type: "string", "x-unknown-enum": ["red", "green"] };

describe("unknown-enums", () => {
	test("closes the schema on its known values in the test bundle", async () => {
		const schemas = await bundle({ Color }, { close: true });
		expect(schemas.Color).toStrictEqual({ title: "Color", type: "string", enum: ["red", "green"] });
	});

	test("lists the known values as examples elsewhere", async () => {
		const schemas = await bundle({ Color });
		expect(schemas.Color).toStrictEqual({ title: "Color", type: "string", examples: ["red", "green"] });
	});

	test("keeps examples a schema already gives", async () => {
		const schemas = await bundle({ Color: { ...Color, examples: ["red"] } });
		expect(schemas.Color).toStrictEqual({ title: "Color", type: "string", examples: ["red"] });
	});

	test("leaves a schema without known values alone", async () => {
		const Shade = { title: "Shade", type: "string", examples: ["dark"] };
		expect((await bundle({ Shade }, { close: true })).Shade).toStrictEqual(Shade);
	});
});
