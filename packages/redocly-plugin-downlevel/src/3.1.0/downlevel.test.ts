import { describe, expect, test } from "bun:test";

import { layer, reference } from "../fixture.ts";

const from31 = layer("3.1.0", "3.0.4");
const loosening = layer("3.1.0", "3.0.4", { loosenUnions: true });

describe("type", () => {
	test("turns a type pair with null into nullable", async () => {
		const { schemas, problems } = await from31.schemas({
			A: { type: ["string", "null"], description: "a" },
			B: { type: ["null", "object"], properties: { c: { type: "string" } } }
		});
		expect(schemas).toStrictEqual({
			A: { type: "string", nullable: true, description: "a" },
			B: { type: "object", nullable: true, properties: { c: { type: "string" } } }
		});
		expect(problems).toStrictEqual([]);
	});

	test("reaches nested schemas", async () => {
		const { schemas } = await from31.schemas({
			A: { type: "array", items: { type: ["integer", "null"] } },
			B: { type: "object", properties: { c: { allOf: [{ type: ["boolean", "null"] }] } } }
		});
		expect(schemas).toStrictEqual({
			A: { type: "array", items: { type: "integer", nullable: true } },
			B: { type: "object", properties: { c: { allOf: [{ type: "boolean", nullable: true }] } } }
		});
	});

	test("leaves a single type alone", async () => {
		const { schemas, problems } = await from31.schemas({ A: { type: "string" } });
		expect(schemas).toStrictEqual({ A: { type: "string" } });
		expect(problems).toStrictEqual([]);
	});

	test("reports a type 3.0 cannot express", async () => {
		const { problems } = await from31.schemas({
			A: { type: "null" },
			B: { type: ["null"] }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/components/schemas/A/type", message: "OpenAPI 3.0.4 has no `null` type." },
			{ severity: "error", pointer: "#/components/schemas/B/type", message: "OpenAPI 3.0.4 has no `null` type." }
		]);
	});

	test("writes several types as the union they are", async () => {
		const { schemas, problems } = await from31.schemas({
			A: { type: ["string", "integer"], minLength: 1 },
			B: { type: ["string", "integer", "null"] }
		});
		expect(schemas).toStrictEqual({
			A: { anyOf: [{ type: "string" }, { type: "integer" }], minLength: 1 },
			B: { anyOf: [{ type: "string", nullable: true }, { type: "integer", nullable: true }] }
		});
		expect(problems).toStrictEqual([]);
	});

	test("loosens several types as the union they are", async () => {
		const { schemas, problems } = await loosening.schemas({
			A: { type: ["string", "integer"], minLength: 1, description: "a" },
			B: { type: ["string", "integer", "null"] },
			C: { type: ["string", "integer"], oneOf: [{ minLength: 1 }, { minimum: 1 }] }
		});
		expect(schemas).toStrictEqual({
			A: { minLength: 1, description: "a" },
			B: {},
			C: { allOf: [{}] }
		});
		expect(problems).toStrictEqual([]);
	});
});

describe("unions", () => {
	const user = {
		type: "object",
		required: ["id", "name"],
		properties: { id: { type: "string" }, name: { type: "string" }, state: reference("State"), age: { type: "integer" } }
	};
	const current = {
		type: "object",
		required: ["id", "email"],
		properties: { id: { type: "string" }, email: { type: "string" }, state: reference("State") }
	};
	const state = { type: "string", enum: ["active", "offline"] };

	test("merges objects, requiring only what every member requires", async () => {
		const { schemas, problems } = await loosening.schemas({
			User: user,
			Current: current,
			State: state,
			Union: { title: "Union", oneOf: [reference("User"), reference("Current")], discriminator: { propertyName: "id" } }
		});
		expect(schemas.Union).toStrictEqual({
			title: "Union",
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "string" },
				name: { type: "string" },
				state: reference("State"),
				age: { type: "integer" },
				email: { type: "string" }
			}
		});
		expect(problems).toStrictEqual([]);
	});

	test("loosens a property the members declare differently", async () => {
		const { schemas } = await loosening.schemas({
			Union: {
				anyOf: [
					{ type: "object", properties: { kind: { type: "string", enum: ["a"], minLength: 1 } } },
					{ type: "object", properties: { kind: { type: "string", enum: ["b"], minLength: 2 } } }
				]
			}
		});
		expect(schemas.Union).toStrictEqual({ type: "object", properties: { kind: { type: "string", enum: ["a", "b"] } } });
	});

	test("drops an enum some members lack", async () => {
		const { schemas } = await loosening.schemas({
			Union: { oneOf: [{ type: "string", enum: ["a"] }, { type: "string", format: "uri" }] }
		});
		expect(schemas.Union).toStrictEqual({ type: "string" });
	});

	test("loosens array items", async () => {
		const { schemas } = await loosening.schemas({
			Union: { oneOf: [{ type: "array", items: { type: "string" } }, { type: "array", items: { type: "integer" } }] }
		});
		expect(schemas.Union).toStrictEqual({ type: "array", items: {} });
	});

	test("accepts anything when the members' types differ", async () => {
		const { schemas, problems } = await loosening.schemas({
			User: user,
			State: state,
			Union: { description: "Either.", oneOf: [{ type: "string" }, reference("User")] }
		});
		expect(schemas.Union).toStrictEqual({ description: "Either." });
		expect(problems).toStrictEqual([]);
	});

	test("turns a null member into nullable", async () => {
		const { schemas, problems } = await loosening.schemas({
			Union: { oneOf: [{ type: "string", minLength: 1 }, { type: "null" }] }
		});
		expect(schemas.Union).toStrictEqual({ type: "string", minLength: 1, nullable: true });
		expect(problems).toStrictEqual([]);
	});

	test("keeps nullable from a member", async () => {
		const { schemas, problems } = await loosening.schemas({
			Union: { anyOf: [{ type: ["string", "null"] }, { type: "string", enum: ["a"] }] }
		});
		expect(schemas.Union).toStrictEqual({ type: "string", nullable: true });
		expect(problems).toStrictEqual([]);
	});

	test("drops a null member when the rest accepts anything", async () => {
		const { schemas, problems } = await loosening.schemas({
			User: user,
			State: state,
			Union: { oneOf: [{ type: "string" }, { type: "null" }, reference("User")] }
		});
		expect(schemas.Union).toStrictEqual({});
		expect(problems).toStrictEqual([]);
	});

	test("keeps a reference that every member makes", async () => {
		const { schemas, problems } = await loosening.schemas({
			State: state,
			Union: { oneOf: [reference("State"), reference("State")] }
		});
		expect(schemas.Union).toStrictEqual(reference("State"));
		expect(problems).toStrictEqual([]);
	});

	test("reports a nullable reference", async () => {
		const { problems } = await loosening.schemas({
			State: state,
			Union: { anyOf: [reference("State"), { type: "null" }] }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/components/schemas/Union", message: "OpenAPI 3.0.4 cannot make a reference nullable." }
		]);
	});

	test("leaves allOf alone", async () => {
		const { schemas, problems } = await loosening.schemas({
			State: state,
			Intersection: { allOf: [reference("State"), { description: "s" }] }
		});
		expect(schemas.Intersection).toStrictEqual({ allOf: [reference("State"), { description: "s" }] });
		expect(problems).toStrictEqual([]);
	});
});

describe("null members", () => {
	const state = { type: "string", enum: ["active", "offline"] };

	test("keeps a union without null as it is", async () => {
		const { schemas, problems } = await from31.schemas({ A: { oneOf: [{ type: "string" }, { type: "integer" }] } });
		expect(schemas).toStrictEqual({ A: { oneOf: [{ type: "string" }, { type: "integer" }] } });
		expect(problems).toStrictEqual([]);
	});

	test("turns a null member beside one other into nullable", async () => {
		const { schemas, problems } = await from31.schemas({
			A: { description: "a", oneOf: [{ type: "string", minLength: 1 }, { type: "null" }] }
		});
		expect(schemas).toStrictEqual({ A: { description: "a", type: "string", minLength: 1, nullable: true } });
		expect(problems).toStrictEqual([]);
	});

	test("makes every member of an anyOf nullable", async () => {
		const { schemas } = await from31.schemas({ A: { anyOf: [{ type: "string" }, { type: "integer" }, { type: "null" }] } });
		expect(schemas).toStrictEqual({ A: { anyOf: [{ type: "string", nullable: true }, { type: "integer", nullable: true }] } });
	});

	test("reports what nullable cannot reach", async () => {
		const { problems } = await from31.schemas({
			State: state,
			A: { anyOf: [reference("State"), { type: "null" }] },
			B: { oneOf: [{ type: "string" }, { type: "integer" }, { type: "null" }] }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/components/schemas/A", message: "OpenAPI 3.0.4 cannot make a reference nullable." },
			{ severity: "error", pointer: "#/components/schemas/B", message: "OpenAPI 3.0.4 cannot make a `oneOf` nullable: `null` would match every member." }
		]);
	});
});

describe("schema keywords", () => {
	test("turns a numeric exclusive bound into a boolean beside its limit", async () => {
		const { schemas, problems } = await from31.schemas({
			A: { type: "integer", exclusiveMinimum: 3 },
			B: { type: "integer", exclusiveMaximum: 9, maximum: 20 },
			C: { type: "integer", exclusiveMinimum: 3, minimum: 5 },
			D: { type: "integer", exclusiveMinimum: 3, minimum: 3 }
		});
		expect(schemas).toStrictEqual({
			A: { type: "integer", minimum: 3, exclusiveMinimum: true },
			B: { type: "integer", maximum: 9, exclusiveMaximum: true },
			C: { type: "integer", minimum: 5 },
			D: { type: "integer", minimum: 3, exclusiveMinimum: true }
		});
		expect(problems).toStrictEqual([]);
	});

	test("leaves a boolean exclusive bound alone", async () => {
		const { schemas, problems } = await from31.schemas({ A: { type: "integer", minimum: 3, exclusiveMinimum: true } });
		expect(schemas).toStrictEqual({ A: { type: "integer", minimum: 3, exclusiveMinimum: true } });
		expect(problems).toStrictEqual([]);
	});

	test("keeps the first of a schema's examples", async () => {
		const { schemas, problems } = await from31.schemas({
			A: { type: "string", examples: ["a", "b"] },
			B: { type: "string", example: "kept", examples: ["c"] },
			C: { type: "string", examples: [] }
		});
		expect(schemas).toStrictEqual({
			A: { type: "string", example: "a" },
			B: { type: "string", example: "kept" },
			C: { type: "string" }
		});
		expect(problems).toStrictEqual([]);
	});

	test("turns const into a one-value enum", async () => {
		const { schemas, problems } = await from31.schemas({
			A: { type: "boolean", const: false },
			B: { type: "string", const: "b", enum: ["a", "b"] }
		});
		expect(schemas).toStrictEqual({
			A: { type: "boolean", enum: [false] },
			B: { type: "string", enum: ["b"] }
		});
		expect(problems).toStrictEqual([]);
	});

	test("reports a const outside its enum", async () => {
		const { problems } = await from31.schemas({ A: { type: "string", const: "c", enum: ["a", "b"] } });
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/components/schemas/A/const", message: "OpenAPI 3.0.4 cannot express a `const` outside `enum`." }
		]);
	});

	test("turns content keywords into the formats 3.0 uses", async () => {
		const { schemas } = await from31.schemas({
			A: { type: "string", contentEncoding: "base64" },
			B: { type: "string", contentMediaType: "application/octet-stream" },
			C: { type: "string", contentMediaType: "image/png", contentEncoding: "base64", contentSchema: { type: "object" } },
			E: { type: "string", format: "uri", contentEncoding: "base64" }
		});
		expect(schemas).toStrictEqual({
			A: { type: "string", format: "byte" },
			B: { type: "string", format: "binary" },
			C: { type: "string", format: "byte" },
			E: { type: "string", format: "uri" }
		});
	});

	test("reports an encoding 3.0 has no format for", async () => {
		const { problems } = await from31.schemas({ A: { type: "string", contentEncoding: "base64url" } });
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/components/schemas/A/contentEncoding", message: "OpenAPI 3.0.4 has no `contentEncoding: base64url`." }
		]);
	});

	test("turns boolean schemas into the objects 3.0 requires", async () => {
		const { schemas, problems } = await from31.schemas({
			A: { type: "object", properties: { open: true, closed: false }, additionalProperties: false },
			B: { type: "array", items: false },
			C: { not: true, allOf: [true, { type: "string" }] }
		});
		expect(schemas).toStrictEqual({
			A: { type: "object", properties: { open: {}, closed: { not: {} } }, additionalProperties: false },
			B: { type: "array", items: { not: {} } },
			C: { not: {}, allOf: [{}, { type: "string" }] }
		});
		expect(problems).toStrictEqual([]);
	});

	test("gives an array without items any items", async () => {
		const { schemas } = await from31.schemas({ A: { type: "array" }, B: { type: ["array", "null"] } });
		expect(schemas).toStrictEqual({ A: { type: "array", items: {} }, B: { type: "array", nullable: true, items: {} } });
	});

	test("drops a nullable 3.1 does not read before writing its own", async () => {
		const { schemas } = await from31.schemas({ A: { type: "string", nullable: true }, B: { type: ["string", "null"], nullable: false } });
		expect(schemas).toStrictEqual({ A: { type: "string" }, B: { type: "string", nullable: true } });
	});

	test("rewrites the empty lists 3.0 forbids", async () => {
		const { schemas } = await from31.schemas({ A: { type: "object", required: [] }, B: { type: "string", enum: [] } });
		expect(schemas).toStrictEqual({ A: { type: "object" }, B: { type: "string", not: {} } });
	});

	test("reports schema rules 3.0 adds", async () => {
		const { problems } = await from31.schemas({
			A: { type: "string", default: 1 },
			B: { type: ["string", "null"], default: null },
			C: { type: "integer", default: 1.5 },
			D: { type: "string", readOnly: true, writeOnly: true }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/components/schemas/A/default", message: "OpenAPI 3.0.4 requires `default` to match `type`." },
			{ severity: "error", pointer: "#/components/schemas/C/default", message: "OpenAPI 3.0.4 requires `default` to match `type`." },
			{ severity: "error", pointer: "#/components/schemas/D", message: "OpenAPI 3.0.4 forbids `readOnly` and `writeOnly` together." }
		]);
	});

	test("reports a reference that is not a JSON Pointer", async () => {
		const { problems } = await from31.schemas({
			A: { $anchor: "a", type: "string" },
			B: { type: "object", properties: { a: { $ref: "#a" } } }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/components/schemas/B/properties/a", message: "OpenAPI 3.0.4 reads a `$ref` fragment only as a JSON Pointer." }
		]);
	});

	test("drops schema identifiers and comments", async () => {
		const { schemas } = await from31.schemas({
			A: {
				$schema: "https://json-schema.org/draft/2020-12/schema",
				$vocabulary: { "https://json-schema.org/draft/2020-12/vocab/core": true },
				$id: "a",
				id: "a",
				$anchor: "a",
				$dynamicAnchor: "a",
				$recursiveAnchor: true,
				$comment: "c",
				type: "string"
			}
		});
		expect(schemas).toStrictEqual({ A: { type: "string" } });
	});

	test("reports keywords 3.0 does not have", async () => {
		const { problems } = await from31.schemas({
			A: { type: "array", prefixItems: [{ type: "string" }] },
			B: { type: "object", patternProperties: { "^x": { type: "string" } }, unevaluatedProperties: false },
			C: { type: "object", definitions: { d: { type: "string" } }, dependencies: { a: ["b"] } },
			D: { $recursiveRef: "#" }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/components/schemas/A/prefixItems", message: "OpenAPI 3.0.4 has no `prefixItems`." },
			{ severity: "error", pointer: "#/components/schemas/B/patternProperties", message: "OpenAPI 3.0.4 has no `patternProperties`." },
			{ severity: "error", pointer: "#/components/schemas/B/unevaluatedProperties", message: "OpenAPI 3.0.4 has no `unevaluatedProperties`." },
			{ severity: "error", pointer: "#/components/schemas/C/definitions", message: "OpenAPI 3.0.4 has no `definitions`." },
			{ severity: "error", pointer: "#/components/schemas/C/dependencies", message: "OpenAPI 3.0.4 has no `dependencies`." },
			{ severity: "error", pointer: "#/components/schemas/D/$recursiveRef", message: "OpenAPI 3.0.4 has no `$recursiveRef`." }
		]);
	});

	test("wraps a reference whose siblings constrain it", async () => {
		const { schemas } = await from31.schemas({
			Name: { type: "string" },
			A: { $ref: "#/components/schemas/Name", minLength: 1, description: "a" }
		});
		expect(schemas.A).toStrictEqual({ allOf: [reference("Name")], minLength: 1, description: "a" });
	});

	test("leaves a reference with only annotations beside it", async () => {
		const { schemas, problems } = await from31.schemas({
			Name: { type: "string" },
			A: { $ref: "#/components/schemas/Name", description: "a", deprecated: true, nullable: true }
		});
		expect(schemas.A).toStrictEqual({ $ref: "#/components/schemas/Name", description: "a", deprecated: true, nullable: true });
		expect(problems).toStrictEqual([]);
	});
});

describe("document", () => {
	test("drops the fields 3.0 does not have", async () => {
		const { document, problems } = await from31({
			jsonSchemaDialect: "https://spec.openapis.org/oas/3.1/dialect/base",
			info: { title: "fixture", version: "1", summary: "s", license: { name: "MIT", identifier: "MIT" } },
			webhooks: { ping: { post: { responses: { 200: { description: "ok" } } } } }
		});
		expect(document).toStrictEqual({
			openapi: "3.0.4",
			info: { title: "fixture", version: "1", license: { name: "MIT" } },
			paths: {},
			components: {}
		});
		expect(problems).toStrictEqual([]);
	});

	test("inlines path items from components", async () => {
		const item = { get: { responses: { 200: { description: "ok" } } } };
		const { document } = await from31({
			paths: { "/a": { $ref: "#/components/pathItems/A" } },
			components: { pathItems: { A: item } }
		});
		expect(document.paths).toStrictEqual({ "/a": item });
		expect(document.components).toStrictEqual({});
	});

	test("gives a description without paths an empty one", async () => {
		const { document } = await from31({ paths: undefined, components: { schemas: { A: { type: "string" } } } });
		expect(document.paths).toStrictEqual({});
	});

	test("reports an operation without responses", async () => {
		const { problems } = await from31({ paths: { "/a": { get: { summary: "a" } } } });
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/paths/~1a/get", message: "OpenAPI 3.0.4 requires `responses`." }
		]);
	});

	test("reports mutual TLS", async () => {
		const { problems } = await from31({ components: { securitySchemes: { tls: { type: "mutualTLS" } } } });
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/components/securitySchemes/tls/type", message: "OpenAPI 3.0.4 has no `type: mutualTLS`." }
		]);
	});
});

describe("paths and operations", () => {
	const ok = { 200: { description: "ok" } };
	const id = { name: "id", in: "path", required: true, schema: { type: "string" } };

	test("drops an empty path item whose template has no parameter", async () => {
		const { document } = await from31({
			paths: { "/a/{id}": { summary: "a" }, "/b/{id}": { parameters: [id] }, "/c": { get: { responses: ok } } }
		});
		expect(document.paths).toStrictEqual({ "/b/{id}": { parameters: [id] }, "/c": { get: { responses: ok } } });
	});

	test("reports what a 3.0 reader ignores", async () => {
		const { problems } = await from31({
			security: [{ key: ["admin"] }],
			paths: { "/a": { get: { requestBody: { content: { "application/json": {} } }, responses: ok } } },
			components: { securitySchemes: { key: { type: "apiKey", in: "header", name: "key" } } }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/security/0/key", message: "OpenAPI 3.0.4 lists roles only for `oauth2` and `openIdConnect` schemes." },
			{ severity: "error", pointer: "#/paths/~1a/get/requestBody", message: "OpenAPI 3.0.4 ignores `requestBody` on `get`." }
		]);
	});

	test("reports a link to an operation 3.0 does not have", async () => {
		const { problems } = await from31({
			webhooks: { ping: { post: { operationId: "ping", responses: ok } } },
			paths: { "/a": { get: { responses: { 200: { description: "ok", links: { ping: { operationRef: "#/webhooks/ping/post" } } } } } } }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/paths/~1a/get/responses/200/links/ping/operationRef", message: "OpenAPI 3.0.4 has no `webhooks` for this to point into." }
		]);
	});

	test("reports a relative URL, which 3.0 resolves against a different base", async () => {
		const { problems } = await from31({
			info: { title: "fixture", version: "1", termsOfService: "/terms", contact: { url: "https://example.com" } }
		});
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/info/termsOfService", message: "OpenAPI 3.0.4 resolves a relative URL against a different base." }
		]);
	});
});

describe("multipart", () => {
	const body = (schema: Record<string, unknown>, encoding?: Record<string, unknown>) => ({
		paths: { "/a": { post: { requestBody: { content: { "multipart/form-data": { schema, ...(encoding && { encoding }) } } }, responses: { 200: { description: "ok" } } } } }
	});
	const media = (document: Record<string, any>) => document.paths["/a"].post.requestBody.content["multipart/form-data"];

	test("types a part that 3.1 sends as octets", async () => {
		const { document } = await from31(body({ type: "object", properties: { file: {}, files: { type: "array", items: {} }, note: { type: "string" } } }));
		expect(media(document).schema).toStrictEqual({
			type: "object",
			properties: {
				file: { type: "string", format: "binary" },
				files: { type: "array", items: { type: "string", format: "binary" } },
				note: { type: "string" }
			}
		});
	});

	test("reports serialization fields 3.0 ignores in multipart", async () => {
		const { problems } = await from31(body({ type: "object", properties: { tags: { type: "array", items: { type: "string" } } } }, { tags: { style: "form", explode: true } }));
		expect(problems).toStrictEqual([
			{ severity: "error", pointer: "#/paths/~1a/post/requestBody/content/multipart~1form-data/encoding/tags/style", message: "OpenAPI 3.0.4 ignores `style` in multipart." },
			{ severity: "error", pointer: "#/paths/~1a/post/requestBody/content/multipart~1form-data/encoding/tags/explode", message: "OpenAPI 3.0.4 ignores `explode` in multipart." }
		]);
	});
});
