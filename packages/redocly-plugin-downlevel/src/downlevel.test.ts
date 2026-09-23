import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { bundle, createConfig } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import { downlevel } from "./fixture.ts";
import plugin from "./index.ts";

describe("planning", () => {
	test("walks every release from 3.2.1 down to 3.0.0", async () => {
		const { document, problems } = await downlevel(
			{
				openapi: "3.2.1",
				servers: [{ url: "https://example.com", name: "production" }],
				components: { schemas: { A: { type: ["string", "null"] } } }
			},
			{ version: "3.0.0" }
		);
		expect(document).toStrictEqual({
			openapi: "3.0.0",
			info: { title: "fixture", version: "1" },
			servers: [{ url: "https://example.com" }],
			paths: {},
			components: { schemas: { A: { type: "string", nullable: true } } }
		});
		expect(problems).toStrictEqual([]);
	});

	test("takes a minor version to mean its latest release", async () => {
		const { document } = await downlevel({ openapi: "3.2.1" }, { version: "3.1" });
		expect(document.openapi).toBe("3.1.2");
	});

	test("stops at an exact release", async () => {
		const { document } = await downlevel({ openapi: "3.2.1", components: { schemas: { A: { type: ["string", "null"] } } } }, { version: "3.1.1" });
		expect(document.openapi).toBe("3.1.1");
		expect(document.components?.schemas).toStrictEqual({ A: { type: ["string", "null"] } });
	});

	test("leaves a description already at the target alone", async () => {
		const { document, problems } = await downlevel(
			{ openapi: "3.0.3", components: { schemas: { A: { oneOf: [{ type: "string" }, { type: "integer" }] } } } },
			{ version: "3.0.3", loosenUnions: true }
		);
		expect(document.openapi).toBe("3.0.3");
		expect(document.components?.schemas).toStrictEqual({ A: { oneOf: [{ type: "string" }, { type: "integer" }] } });
		expect(problems).toStrictEqual([]);
	});

	test("reports a target it cannot reach", async () => {
		const above = await downlevel({ openapi: "3.0.3" }, { version: "3.1" });
		const unknown = await downlevel({ openapi: "3.1.0" }, { version: "2.0" });
		const unreleased = await downlevel({ openapi: "3.1.9" }, { version: "3.0" });
		const major = await downlevel({ openapi: "3.1.0" }, { version: "3" });
		const missing = await downlevel({ openapi: "3.1.0" }, {});
		expect([above, unknown, unreleased, major, missing].map(({ problems }) => problems)).toStrictEqual([
			[{ severity: "error", pointer: "#/openapi", message: "Cannot downlevel OpenAPI 3.0.3 to 3.1." }],
			[{ severity: "error", pointer: "#/openapi", message: "Cannot downlevel OpenAPI 3.1.0 to 2.0." }],
			[{ severity: "error", pointer: "#/openapi", message: "Cannot downlevel OpenAPI 3.1.9 to 3.0." }],
			[{ severity: "error", pointer: "#/openapi", message: "Cannot downlevel OpenAPI 3.1.0 to 3." }],
			[{ severity: "error", pointer: "#/", message: "Set `version` to the OpenAPI version to write, such as `\"3.0\"`." }]
		]);
	});

	test("reports a version YAML read as a number", async () => {
		const { document, problems } = await downlevel({ openapi: "3.1.0" }, { version: 3 as unknown as string });
		expect(document.openapi).toBe("3.1.0");
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/", message: "Quote `version`: YAML reads an unquoted 3.0 as the number 3." }
		]);
	});
});

describe("reports", () => {
	test("point at the file the construct is written in", async () => {
		const directory = mkdtempSync(path.join(tmpdir(), "downlevel-"));
		writeFileSync(
			path.join(directory, "openapi.yaml"),
			"openapi: 3.1.0\ninfo: {title: fixture, version: \"1\"}\npaths: {}\ncomponents:\n  schemas:\n    A:\n      $ref: ./a.yaml\n"
		);
		writeFileSync(path.join(directory, "a.yaml"), "type: object\nproperties:\n  b:\n    type: \"null\"\n");

		const config = await createConfig({ plugins: [plugin()], decorators: { "downlevel/openapi": { version: "3.0" } } });
		const { problems } = await bundle({ ref: path.join(directory, "openapi.yaml"), config });
		expect(problems.map(({ location: [{ source, pointer }] }) => ({ file: path.basename(source.absoluteRef), pointer }))).toStrictEqual([
			{ file: "a.yaml", pointer: "#/properties/b/type" }
		]);
	});
});
