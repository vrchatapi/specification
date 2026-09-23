import { describe, expect, test } from "bun:test";

import { layer } from "../fixture.ts";

const from32 = layer("3.2.0", "3.1.2");

const ok = { 200: { description: "ok" } };

describe("document", () => {
	test("drops the fields 3.1 does not have", async () => {
		const { document, problems } = await from32({
			$self: "https://example.com/openapi.yaml",
			servers: [{ url: "https://example.com", name: "production" }],
			tags: [{ name: "a", summary: "A", kind: "nav" }, { name: "b", parent: "a" }],
			paths: { "/a": { get: { responses: { 200: { description: "ok", summary: "OK" } } } } },
			components: {
				securitySchemes: { key: { type: "apiKey", in: "header", name: "key", deprecated: true } },
				schemas: {
					Pet: {
						type: "object",
						discriminator: { propertyName: "kind", defaultMapping: "#/components/schemas/Cat" },
						required: ["kind"],
						properties: { kind: { type: "string" } }
					},
					Cat: { type: "object" }
				}
			}
		});
		expect(document).toStrictEqual({
			openapi: "3.1.2",
			info: { title: "fixture", version: "1" },
			servers: [{ url: "https://example.com" }],
			tags: [{ name: "a" }, { name: "b" }],
			paths: { "/a": { get: { responses: { 200: { description: "ok" } } } } },
			components: {
				securitySchemes: { key: { type: "apiKey", in: "header", name: "key" } },
				schemas: {
					Pet: { type: "object", discriminator: { propertyName: "kind" }, required: ["kind"], properties: { kind: { type: "string" } } },
					Cat: { type: "object" }
				}
			}
		});
		expect(problems).toStrictEqual([]);
	});

	test("gives a response without a description an empty one", async () => {
		const { document } = await from32({ paths: { "/a": { get: { responses: { 200: {} } } } } });
		expect(document.paths).toStrictEqual({ "/a": { get: { responses: { 200: { description: "" } } } } });
	});

	test("inlines media types from components", async () => {
		const json = { schema: { type: "string" } };
		const { document } = await from32({
			paths: { "/a": { get: { responses: { 200: { description: "ok", content: { "application/json": { $ref: "#/components/mediaTypes/Json" } } } } } } },
			components: { mediaTypes: { Json: json } }
		});
		expect(document.paths).toStrictEqual({
			"/a": { get: { responses: { 200: { description: "ok", content: { "application/json": json } } } } }
		});
		expect(document.components).toStrictEqual({});
	});
});

describe("examples", () => {
	test("turns dataValue and serializedValue into value", async () => {
		const { document } = await from32({
			components: {
				examples: {
					Data: { dataValue: { a: 1 } },
					Serialized: { serializedValue: "a=1" },
					Both: { dataValue: { a: 1 }, serializedValue: "a=1" }
				}
			}
		});
		expect(document.components).toStrictEqual({
			examples: {
				Data: { value: { a: 1 } },
				Serialized: { value: "a=1" },
				Both: { value: { a: 1 } }
			}
		});
	});
});

describe("xml", () => {
	test("turns nodeType into the flags 3.1 uses", async () => {
		const { document, problems } = await from32({
			components: {
				schemas: {
					Attribute: { type: "string", xml: { nodeType: "attribute" } },
					Wrapped: { type: "array", items: { type: "string" }, xml: { nodeType: "element", name: "list" } },
					Element: { type: "string", xml: { nodeType: "element" } },
					Unwrapped: { type: "array", items: { type: "string" }, xml: { nodeType: "none" } }
				}
			}
		});
		expect(document.components?.schemas).toStrictEqual({
			Attribute: { type: "string", xml: { attribute: true } },
			Wrapped: { type: "array", items: { type: "string" }, xml: { wrapped: true, name: "list" } },
			Element: { type: "string", xml: {} },
			Unwrapped: { type: "array", items: { type: "string" }, xml: {} }
		});
		expect(problems).toStrictEqual([]);
	});

	test("reports a node type 3.1 cannot express", async () => {
		const { problems } = await from32({
			components: { schemas: { Text: { type: "string", xml: { nodeType: "text" } }, None: { type: "string", xml: { nodeType: "none" } } } }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/components/schemas/Text/xml/nodeType", message: "OpenAPI 3.1.2 has no `nodeType: text`." },
			{ severity: "error", pointer: "#/components/schemas/None/xml/nodeType", message: "OpenAPI 3.1.2 has no `nodeType: none`." }
		]);
	});
});

describe("reports", () => {
	test("reports what 3.1 cannot express", async () => {
		const { problems } = await from32({
			paths: {
				"/a": {
					query: { responses: ok },
					parameters: [
						{ name: "q", in: "querystring", content: { "application/x-www-form-urlencoded": { schema: { type: "object" } } } },
						{ name: "c", in: "cookie", style: "cookie", schema: { type: "string" } }
					]
				}
			},
			components: {
				securitySchemes: {
					device: { type: "oauth2", flows: { deviceAuthorization: { deviceAuthorizationUrl: "https://example.com/device", tokenUrl: "https://example.com/token", scopes: {} } } }
				}
			}
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/paths/~1a/query", message: "OpenAPI 3.1.2 has no `query`." },
			{ severity: "error", pointer: "#/paths/~1a/parameters/0/in", message: "OpenAPI 3.1.2 has no `in: querystring`." },
			{ severity: "error", pointer: "#/paths/~1a/parameters/1/style", message: "OpenAPI 3.1.2 has no `style: cookie`." },
			{ severity: "error", pointer: "#/components/securitySchemes/device/flows/deviceAuthorization", message: "OpenAPI 3.1.2 has no `deviceAuthorization`." }
		]);
	});

	test("reports sequential media types", async () => {
		const { problems } = await from32({
			paths: { "/a": { get: { responses: { 200: { description: "ok", content: { "application/jsonl": { itemSchema: { type: "object" } } } } } } } }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/paths/~1a/get/responses/200/content/application~1jsonl/itemSchema", message: "OpenAPI 3.1.2 has no `itemSchema`." }
		]);
	});
});

describe("parameters", () => {
	test("makes deepObject explode, the only way 3.1 defines it", async () => {
		const { document } = await from32({
			paths: {
				"/a": {
					get: {
						parameters: [
							{ name: "filter", in: "query", style: "deepObject", schema: { type: "object" } },
							{ name: "sort", in: "query", style: "deepObject", explode: false, schema: { type: "object" } }
						],
						responses: ok
					}
				}
			}
		});
		expect(document.paths).toStrictEqual({
			"/a": {
				get: {
					parameters: [
						{ name: "filter", in: "query", style: "deepObject", explode: true, schema: { type: "object" } },
						{ name: "sort", in: "query", style: "deepObject", explode: true, schema: { type: "object" } }
					],
					responses: ok
				}
			}
		});
	});

	test("moves examples beside content into the media type", async () => {
		const { document, problems } = await from32({
			paths: {
				"/a": {
					get: {
						parameters: [{ name: "q", in: "query", content: { "application/json": { schema: { type: "object" } } }, example: { a: 1 } }],
						responses: {
							200: {
								description: "ok",
								headers: { "X-A": { content: { "text/plain": { schema: { type: "string" } } }, examples: { one: { value: "1" } } } }
							}
						}
					}
				}
			}
		});
		expect(document.paths).toStrictEqual({
			"/a": {
				get: {
					parameters: [{ name: "q", in: "query", content: { "application/json": { schema: { type: "object" }, example: { a: 1 } } } }],
					responses: {
						200: {
							description: "ok",
							headers: { "X-A": { content: { "text/plain": { schema: { type: "string" }, examples: { one: { value: "1" } } } } } }
						}
					}
				}
			}
		});
		expect(problems).toStrictEqual([]);
	});

	test("reports examples that collide with the media type's", async () => {
		const { problems } = await from32({
			paths: { "/a": { get: { parameters: [{ name: "q", in: "query", content: { "application/json": { example: 2 } }, example: 1 }], responses: ok } } }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/paths/~1a/get/parameters/0/example", message: "OpenAPI 3.1.2 has no room for `example` beside `content`: the media type has its own." }
		]);
	});

	test("reports allowReserved where 3.1 does not apply it", async () => {
		const { problems } = await from32({
			paths: {
				"/a/{id}": {
					get: {
						parameters: [
							{ name: "id", in: "path", required: true, allowReserved: true, schema: { type: "string" } },
							{ name: "q", in: "query", allowReserved: true, schema: { type: "string" } }
						],
						responses: ok
					}
				}
			}
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/paths/~1a~1{id}/get/parameters/0/allowReserved", message: "OpenAPI 3.1.2 applies `allowReserved` only to `in: query`." }
		]);
	});
});

describe("security", () => {
	test("names a scheme a requirement gives by URI", async () => {
		const { document, problems } = await from32({
			security: [{ "#/components/securitySchemes/key": [] }, { key: [] }],
			components: { securitySchemes: { key: { type: "apiKey", in: "header", name: "key" } } }
		});
		expect(document.security).toStrictEqual([{ key: [] }, { key: [] }]);
		expect(problems).toStrictEqual([]);
	});

	test("reports a URI that is not a scheme in this document", async () => {
		const { problems } = await from32({ security: [{ "https://example.com/openapi.yaml#/components/securitySchemes/key": [] }] });
		expect(problems).toStrictEqual([
			{
				severity: "error",
				pointer: "#/security/0/https:~1~1example.com~1openapi.yaml#~1components~1securitySchemes~1key",
				message: "OpenAPI 3.1.2 names a security scheme only by its name under `components`."
			}
		]);
	});
});

describe("dialect", () => {
	test("points the 3.2 dialect at the 3.1 one", async () => {
		const { document } = await from32({
			jsonSchemaDialect: "https://spec.openapis.org/oas/3.2/dialect/2025-09-17",
			components: { schemas: { A: { $schema: "https://spec.openapis.org/oas/3.2/dialect/2026-02-26", type: "string" } } }
		});
		expect(document.jsonSchemaDialect).toBe("https://spec.openapis.org/oas/3.1/dialect/base");
		expect(document.components?.schemas).toStrictEqual({ A: { $schema: "https://spec.openapis.org/oas/3.1/dialect/base", type: "string" } });
	});
});

describe("media types", () => {
	const response = (media: string, value: Record<string, unknown>) => ({
		paths: { "/a": { get: { responses: { 200: { description: "ok", content: { [media]: value } } } } } }
	});

	test("drops a media type description, which only the published schema allows", async () => {
		const { document } = await from32(response("application/json", { description: "d", schema: { type: "object" } }));
		expect(document.paths).toStrictEqual(response("application/json", { schema: { type: "object" } }).paths);
	});

	test("reports encoding outside a request body", async () => {
		const { problems } = await from32(response("multipart/form-data", { schema: { type: "object", properties: { a: { type: "string" } } }, encoding: { a: { contentType: "text/plain" } } }));
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/paths/~1a/get/responses/200/content/multipart~1form-data/encoding", message: "OpenAPI 3.1.2 applies `encoding` only to request bodies." }
		]);
	});

	test("reports encoding for a property the schema does not have", async () => {
		const { problems } = await from32({
			paths: {
				"/a": {
					post: {
						requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { a: { type: "string" } } }, encoding: { b: { contentType: "text/plain" } } } } },
						responses: ok
					}
				}
			}
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/paths/~1a/post/requestBody/content/multipart~1form-data/encoding/b", message: "OpenAPI 3.1.2 requires `b` to be a property of the schema." }
		]);
	});

	test("reports what 3.2 gives meaning to and 3.1 does not", async () => {
		const { problems } = await from32({
			paths: {
				"/a": {
					post: { requestBody: { content: { "multipart/form-data": { schema: { type: "array", items: { type: "string" } } } } }, responses: ok },
					get: { responses: { 200: { description: "ok", content: { "application/jsonl": { schema: { type: "array" } } } } } }
				}
			}
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/paths/~1a/get/responses/200/content/application~1jsonl/schema", message: "OpenAPI 3.1.2 gives `schema` no meaning for the sequential media type `application/jsonl`." },
			{ severity: "error", pointer: "#/paths/~1a/post/requestBody/content/multipart~1form-data/schema", message: "OpenAPI 3.1.2 gives an array `schema` no meaning for `multipart/form-data`." }
		]);
	});
});

describe("schemas", () => {
	test("reports a namespace 3.1 cannot hold", async () => {
		const { problems } = await from32({
			components: { schemas: { Tagged: { type: "string", xml: { namespace: "https://example.com/ñ" } }, Plain: { type: "string", xml: { namespace: "https://example.com/n" } } } }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/components/schemas/Tagged/xml/namespace", message: "OpenAPI 3.1.2 requires `namespace` to be a URI, and this IRI is not one." }
		]);
	});
});

describe("defaults", () => {
	test("drops allowReserved: false where 3.1 forbids the field", async () => {
		const { document, problems } = await from32({
			paths: { "/a/{id}": { get: { parameters: [{ name: "id", in: "path", required: true, allowReserved: false, schema: { type: "string" } }], responses: ok } } }
		});
		expect(document.paths).toStrictEqual({
			"/a/{id}": { get: { parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: ok } }
		});
		expect(problems).toStrictEqual([]);
	});

	test("leaves a scheme name the description never declares to the linter", async () => {
		const { document, problems } = await from32({ security: [{ undeclared: [] }] });
		expect(document.security).toStrictEqual([{ undeclared: [] }]);
		expect(problems).toStrictEqual([]);
	});
});
