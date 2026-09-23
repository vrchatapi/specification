import { describe, expect, test } from "bun:test";

import { layer, reference } from "../fixture.ts";

const from311 = layer("3.1.1", "3.1.0");

describe("3.1.1", () => {
	test("spells out the JSON encoding of object properties in form bodies", async () => {
		const { document } = await from311({
			paths: {
				"/a": {
					post: {
						requestBody: {
							content: {
								"application/x-www-form-urlencoded": {
									schema: { type: "object", properties: { filter: { type: "object" }, name: { type: "string" }, set: { type: "object" } } },
									encoding: { set: { contentType: "text/plain" } }
								}
							}
						},
						responses: { 200: { description: "ok" } }
					}
				}
			}
		});
		expect(document.paths?.["/a"]).toStrictEqual({
			post: {
				requestBody: {
					content: {
						"application/x-www-form-urlencoded": {
							schema: { type: "object", properties: { filter: { type: "object" }, name: { type: "string" }, set: { type: "object" } } },
							encoding: { set: { contentType: "text/plain" }, filter: { contentType: "application/json" } }
						}
					}
				},
				responses: { 200: { description: "ok" } }
			}
		});
	});

	test("reads a form body and its properties through references", async () => {
		const { document } = await from311({
			paths: {
				"/a": {
					post: {
						requestBody: { content: { "application/x-www-form-urlencoded": { schema: reference("Form") } } },
						responses: { 200: { description: "ok" } }
					}
				}
			},
			components: {
				schemas: {
					Form: { type: "object", properties: { filter: { type: "object" }, range: reference("Range"), name: { type: "string" } } },
					Range: { type: "object", properties: { from: { type: "integer" } } }
				}
			}
		});
		expect(document.paths?.["/a"]).toStrictEqual({
			post: {
				requestBody: {
					content: {
						"application/x-www-form-urlencoded": {
							schema: reference("Form"),
							encoding: { filter: { contentType: "application/json" }, range: { contentType: "application/json" } }
						}
					}
				},
				responses: { 200: { description: "ok" } }
			}
		});
	});

	test("reports what 3.1.0 reads differently", async () => {
		const { problems } = await from311({
			externalDocs: { url: "docs" },
			components: { schemas: { A: { type: "string", xml: { namespace: "https://example.com/ns#a" } } } }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/externalDocs/url", message: "OpenAPI 3.1.0 resolves a relative URL against a different base." },
			{ severity: "error", pointer: "#/components/schemas/A/xml/namespace", message: "OpenAPI 3.1.0 requires `namespace` to be an absolute URI, without a fragment." }
		]);
	});
});
