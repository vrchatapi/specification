import { describe, expect, test } from "bun:test";

import { layer } from "../fixture.ts";

const from321 = layer("3.2.1", "3.2.0");

const ok = { 200: { description: "ok" } };

describe("3.2.1", () => {
	test("names the dialect 3.2.0 would otherwise take as 3.1's", async () => {
		const { document, problems } = await from321({});
		expect(document.openapi).toBe("3.2.0");
		expect(document.jsonSchemaDialect).toBe("https://spec.openapis.org/oas/3.2/dialect/2026-02-26");
		expect(problems).toStrictEqual([]);
	});

	test("keeps a dialect the description names", async () => {
		const { document, problems } = await from321({ jsonSchemaDialect: "https://example.com/dialect" });
		expect(document.jsonSchemaDialect).toBe("https://example.com/dialect");
		expect(problems).toStrictEqual([]);
	});

	test("reports what 3.2.0 reads differently", async () => {
		const { problems } = await from321({
			paths: {
				"/a": {
					post: {
						requestBody: {
							content: {
								"multipart/mixed": { schema: { type: "object" }, itemEncoding: { contentType: "text/plain" } },
								"multipart/form-data": { schema: { type: "array", items: { type: "string" } } }
							}
						},
						responses: ok
					}
				}
			}
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/paths/~1a/post/requestBody/content/multipart~1mixed/itemEncoding", message: "OpenAPI 3.2.0 requires `itemSchema` or an array `schema` beside `itemEncoding`." },
			{ severity: "error", pointer: "#/paths/~1a/post/requestBody/content/multipart~1form-data/schema", message: "OpenAPI 3.2.0 names `multipart/form-data` parts through `encoding` headers, not array items." }
		]);
	});
});
