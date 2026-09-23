import { describe, expect, test } from "bun:test";

import { layer } from "../fixture.ts";

const from32 = layer("3.2.0", "3.1.2");

const ok = { 200: { description: "ok" } };

describe("document", () => {
	test("writes the fields 3.1 lacks as registry extensions, and drops the rest", async () => {
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
			"x-oai-$self": "https://example.com/openapi.yaml",
			info: { title: "fixture", version: "1" },
			servers: [{ url: "https://example.com", "x-oai-name": "production" }],
			tags: [{ name: "a", "x-displayName": "A" }, { name: "b" }],
			"x-tagGroups": [{ name: "A", tags: ["a", "b"] }],
			paths: { "/a": { get: { responses: { 200: { description: "ok", "x-oai-summary": "OK", "x-summary": "OK" } } } } },
			components: {
				securitySchemes: { key: { type: "apiKey", in: "header", name: "key", "x-oai-deprecated": true } },
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

describe("tags", () => {
	test("writes the guide's 3.2 tags as the extensions 3.1 renderers read", async () => {
		const { document, problems } = await from32({
			tags: [
				{ name: "products", summary: "Products", description: "All product operations", kind: "nav" },
				{ name: "books", summary: "Books & Literature", parent: "products", kind: "nav" },
				{ name: "cds", summary: "Music CDs", parent: "products", kind: "nav" },
				{ name: "giftcards", summary: "Gift Cards", parent: "products", kind: "nav" },
				{ name: "digital-delivery", summary: "Digital Delivery", kind: "badge" }
			],
			paths: { "/giftcards": { get: { tags: ["giftcards", "digital-delivery"], responses: ok } } }
		});
		expect(document.tags).toStrictEqual([
			{ name: "products", "x-displayName": "Products", description: "All product operations" },
			{ name: "books", "x-displayName": "Books & Literature" },
			{ name: "cds", "x-displayName": "Music CDs" },
			{ name: "giftcards", "x-displayName": "Gift Cards" },
			{ name: "digital-delivery", "x-displayName": "Digital Delivery" }
		]);
		expect(document["x-tagGroups"]).toStrictEqual([{ name: "Products", tags: ["products", "books", "cds", "giftcards"] }]);
		expect(document.paths).toStrictEqual({
			"/giftcards": { get: { tags: ["giftcards", "digital-delivery"], "x-badges": [{ name: "Digital Delivery" }], responses: ok } }
		});
		expect(problems).toStrictEqual([]);
	});

	test("groups every tag under its top-level tag, so none drops out of the navigation", async () => {
		const { document } = await from32({
			tags: [{ name: "a" }, { name: "b", parent: "a" }, { name: "c", parent: "b" }, { name: "d", parent: "a" }, { name: "e" }]
		});
		expect(document["x-tagGroups"]).toStrictEqual([
			{ name: "a", tags: ["a", "b", "c", "d"] },
			{ name: "e", tags: ["e"] }
		]);
	});

	test("keeps the extensions the description already has", async () => {
		const groups = [{ name: "Mine", tags: ["b"] }];
		const { document } = await from32({
			tags: [{ name: "a", summary: "A", "x-displayName": "Kept" }, { name: "b", parent: "a" }, { name: "new", summary: "New", kind: "badge" }],
			"x-tagGroups": groups,
			paths: { "/a": { get: { tags: ["b", "new"], "x-badges": [{ name: "New" }, { name: "Beta" }], responses: ok } } }
		});
		expect(document.tags).toStrictEqual([{ name: "a", "x-displayName": "Kept" }, { name: "b" }, { name: "new", "x-displayName": "New" }]);
		expect(document["x-tagGroups"]).toStrictEqual(groups);
		expect(document.paths).toStrictEqual({ "/a": { get: { tags: ["b", "new"], "x-badges": [{ name: "New" }, { name: "Beta" }], responses: ok } } });
	});

	test("adds no tag groups where no tag has a parent", async () => {
		const { document } = await from32({ tags: [{ name: "a", summary: "A" }] });
		expect(document).not.toHaveProperty("x-tagGroups");
	});
});

describe("responses", () => {
	test("writes a response summary as every extension that carries it", async () => {
		const { document } = await from32({
			paths: {
				"/a": {
					get: { responses: { 200: { summary: "OK", description: "Found." }, 404: { summary: "Missing", description: "Gone.", "x-oai-summary": "Kept" } } }
				}
			}
		});
		expect(document.paths).toStrictEqual({
			"/a": { get: { responses: { 200: { "x-oai-summary": "OK", "x-summary": "OK", description: "Found." }, 404: { description: "Gone.", "x-oai-summary": "Kept", "x-summary": "Missing" } } } }
		});
	});
});

describe("examples", () => {
	test("turns dataValue and serializedValue into value, keeping the serialized form in its registry extension", async () => {
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
				Serialized: { value: "a=1", "x-oai-serializedValue": "a=1" },
				Both: { value: { a: 1 }, "x-oai-serializedValue": "a=1" }
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
					parameters: [
						{ name: "q", in: "querystring", content: { "application/x-www-form-urlencoded": { schema: { type: "object" } } } },
						{ name: "c", in: "cookie", style: "cookie", schema: { type: "string" } }
					]
				}
			}
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/paths/~1a/parameters/0/in", message: "OpenAPI 3.1.2 has no `in: querystring`." },
			{ severity: "error", pointer: "#/paths/~1a/parameters/1/style", message: "OpenAPI 3.1.2 has no `style: cookie`." }
		]);
	});

	test("writes item schemas and encodings as their registry extensions", async () => {
		const { document, problems } = await from32({
			paths: {
				"/a": {
					get: { responses: { 200: { description: "ok", content: { "application/jsonl": { itemSchema: { type: "object" } } } } } },
					post: {
						requestBody: {
							content: {
								"multipart/mixed": {
									itemSchema: { type: "string" },
									prefixEncoding: [{ contentType: "application/json" }],
									itemEncoding: { contentType: "image/png" }
								},
								"multipart/form-data": {
									schema: { type: "object", properties: { part: { type: "string" } } },
									encoding: { part: { contentType: "multipart/mixed", encoding: { inner: { contentType: "text/plain" } }, itemEncoding: { contentType: "text/plain" } } }
								}
							}
						},
						responses: ok
					}
				}
			}
		});
		expect(document.paths).toStrictEqual({
			"/a": {
				get: { responses: { 200: { description: "ok", content: { "application/jsonl": { "x-oai-itemSchema": { type: "object" } } } } } },
				post: {
					requestBody: {
						content: {
							"multipart/mixed": {
								"x-oai-itemSchema": { type: "string" },
								"x-oai-prefixEncoding": [{ contentType: "application/json" }],
								"x-oai-itemEncoding": { contentType: "image/png" }
							},
							"multipart/form-data": {
								schema: { type: "object", properties: { part: { type: "string" } } },
								encoding: {
									part: { contentType: "multipart/mixed", "x-oai-encoding": { inner: { contentType: "text/plain" } }, "x-oai-itemEncoding": { contentType: "text/plain" } }
								}
							}
						}
					},
					responses: ok
				}
			}
		});
		expect(problems).toStrictEqual([]);
	});

	test("writes QUERY and other methods as x-oai-additionalOperations", async () => {
		const { document, problems } = await from32({
			paths: {
				"/a": {
					get: { responses: ok },
					query: { operationId: "search", responses: ok },
					additionalOperations: { COPY: { operationId: "copy", responses: ok } }
				}
			}
		});
		expect(document.paths).toStrictEqual({
			"/a": {
				get: { responses: ok },
				"x-oai-additionalOperations": { QUERY: { operationId: "search", responses: ok }, COPY: { operationId: "copy", responses: ok } }
			}
		});
		expect(problems).toStrictEqual([]);
	});

	test("keeps an operation x-oai-additionalOperations already holds", async () => {
		const { document } = await from32({
			paths: { "/a": { query: { operationId: "new", responses: ok }, "x-oai-additionalOperations": { QUERY: { operationId: "kept", responses: ok } } } }
		});
		expect(document.paths).toStrictEqual({ "/a": { "x-oai-additionalOperations": { QUERY: { operationId: "kept", responses: ok } } } });
	});

	test("writes the device authorization flow as its registry extensions", async () => {
		const { document, problems } = await from32({
			components: {
				securitySchemes: {
					device: {
						type: "oauth2",
						flows: { deviceAuthorization: { deviceAuthorizationUrl: "https://example.com/device", tokenUrl: "https://example.com/token", scopes: {} } }
					}
				}
			}
		});
		expect(document.components).toStrictEqual({
			securitySchemes: {
				device: {
					type: "oauth2",
					flows: {
						"x-oai-deviceAuthorization": { "x-oai-deviceAuthorizationUrl": "https://example.com/device", tokenUrl: "https://example.com/token", scopes: {} }
					}
				}
			}
		});
		expect(problems).toStrictEqual([]);
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
