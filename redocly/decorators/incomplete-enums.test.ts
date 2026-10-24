import { bundleFromString, createConfig } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import plugin from "../plugin.ts";

async function bundle(schemas: Record<string, unknown>, options: Record<string, unknown> = {}) {
	const config = await createConfig({ plugins: [plugin()], decorators: { "vrchat/incomplete-enums": { severity: "on", ...options } } });
	const source = JSON.stringify({ openapi: "3.2.0", info: { title: "fixture", version: "1" }, paths: {}, components: { schemas } });
	return (await bundleFromString({ source, config })).bundle.parsed.components.schemas as Record<string, unknown>;
}

const Color = { title: "Color", type: "string", enum: ["red", "green"], "x-incomplete": true };

describe("incomplete-enums", () => {
	test("keeps the known values as the enum in the test bundle", async () => {
		const schemas = await bundle({ Color }, { close: true });
		expect(schemas.Color).toStrictEqual({ title: "Color", type: "string", enum: ["red", "green"], "x-incomplete": true });
	});

	test("lists the known values as examples elsewhere, still marked incomplete", async () => {
		const schemas = await bundle({ Color });
		expect(schemas.Color).toStrictEqual({ title: "Color", type: "string", examples: ["red", "green"], "x-incomplete": true });
	});

	test("leaves a complete enum alone", async () => {
		const Shade = { title: "Shade", type: "string", enum: ["dark", "light"] };
		expect((await bundle({ Shade })).Shade).toStrictEqual(Shade);
		expect((await bundle({ Shade }, { close: true })).Shade).toStrictEqual(Shade);
	});

	test("leaves a schema without an enum alone", async () => {
		const Name = { title: "Name", type: "string", examples: ["aries"] };
		expect((await bundle({ Name }, { close: true })).Name).toStrictEqual(Name);
	});
});
