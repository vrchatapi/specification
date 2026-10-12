import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createConfig, lint } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import plugin from "../plugin.ts";

const operation = (id: string) => ({ get: { operationId: id, responses: { 200: { description: "OK" } } } });

async function problems(files: Record<string, unknown>) {
	const directory = mkdtempSync(join(tmpdir(), "no-unlisted-paths-"));
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(join(directory, path, ".."), { recursive: true });
		writeFileSync(join(directory, path), JSON.stringify(content));
	}
	const config = await createConfig({ plugins: [plugin()], rules: { "vrchat/no-unlisted-paths": "error" } });
	const found = await lint({ ref: join(directory, "openapi.yaml"), config });
	return found
		.filter((problem) => problem.ruleId === "vrchat/no-unlisted-paths")
		.map((problem) => `${problem.location[0].source.absoluteRef.slice(directory.length + 1)} ${problem.location[0].pointer}`)
		.sort();
}

const root = { openapi: "3.2.0", info: { title: "fixture", version: "1" }, paths: { $ref: "./paths.yaml" } };

describe("no-unlisted-paths", () => {
	test("accepts a paths list that names every path its files define", async () => {
		const found = await problems({
			"openapi.yaml": root,
			"paths.yaml": { "/a": { $ref: "./paths/a.yaml#/paths/~1a" } },
			"paths/a.yaml": { paths: { "/a": operation("getA") } }
		});
		expect(found).toStrictEqual([]);
	});

	test("reports a path its file defines that the list leaves out", async () => {
		const found = await problems({
			"openapi.yaml": root,
			"paths.yaml": { "/a": { $ref: "./paths/a.yaml#/paths/~1a" } },
			"paths/a.yaml": { paths: { "/a": operation("getA"), "/b": operation("getB") } }
		});
		expect(found).toStrictEqual(["paths/a.yaml #/paths/~1b"]);
	});

	test("reports the paths of a file the list never references", async () => {
		const found = await problems({
			"openapi.yaml": root,
			"paths.yaml": { "/a": { $ref: "./paths/a.yaml#/paths/~1a" } },
			"paths/a.yaml": { paths: { "/a": operation("getA") } },
			"paths/c.yaml": { paths: { "/c": operation("getC") } }
		});
		expect(found).toStrictEqual(["paths/c.yaml #/paths/~1c"]);
	});
});
