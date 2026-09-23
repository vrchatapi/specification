import { describe, expect, test } from "bun:test";

import { layer } from "../fixture.ts";

const from304 = layer("3.0.4", "3.0.3");

const ok = { 200: { description: "ok" } };

describe("3.0.4", () => {
	test("spells out the encodings 3.0.3 defaulted differently", async () => {
		const { document } = await from304({
			paths: {
				"/a": {
					post: {
						requestBody: {
							content: {
								"application/x-www-form-urlencoded": { schema: { type: "object", properties: { filter: { type: "object" } } } },
								"multipart/form-data": { schema: { type: "object", properties: { key: { type: "string", format: "byte" } } } }
							}
						},
						responses: ok
					}
				}
			}
		});
		expect(document.paths?.["/a"]).toStrictEqual({
			post: {
				requestBody: {
					content: {
						"application/x-www-form-urlencoded": {
							schema: { type: "object", properties: { filter: { type: "object" } } },
							encoding: { filter: { contentType: "application/json" } }
						},
						"multipart/form-data": {
							schema: { type: "object", properties: { key: { type: "string", format: "byte" } } },
							encoding: { key: { contentType: "application/octet-stream" } }
						}
					}
				},
				responses: ok
			}
		});
	});

	test("reports what 3.0.3 reads differently or forbids", async () => {
		const { problems } = await from304({
			info: { title: "fixture", version: "1", termsOfService: "terms" },
			paths: { "/a": { get: { parameters: [{ name: "f", in: "query", style: "pipeDelimited", schema: { type: "object" } }], responses: ok } } }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/info/termsOfService", message: "OpenAPI 3.0.3 resolves a relative URL against a different base." },
			{ severity: "error", pointer: "#/paths/~1a/get/parameters/0/style", message: "OpenAPI 3.0.3 allows `style: pipeDelimited` only for arrays." }
		]);
	});
});
