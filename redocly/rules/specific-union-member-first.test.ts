import { createConfig, lintFromString } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import plugin from "../plugin.ts";

const reference = (name: string) => ({ $ref: `#/components/schemas/${name}` });

async function messages(schemas: Record<string, unknown>) {
	const config = await createConfig({ plugins: [plugin()], rules: { "vrchat/specific-union-member-first": "error" } });
	const source = JSON.stringify({ openapi: "3.2.0", info: { title: "fixture", version: "1" }, paths: {}, components: { schemas } });
	const problems = await lintFromString({ source, config });
	return problems.filter((problem) => problem.ruleId === "vrchat/specific-union-member-first").map((problem) => problem.message).sort();
}

const User = { title: "User", type: "object", properties: { id: { type: "string" } }, required: ["id"] };
const CurrentUser = { title: "CurrentUser", type: "object", properties: { id: { type: "string" }, email: { type: "string" } }, required: ["id", "email"] };

describe("specific-union-member-first", () => {
	test("reports a member listed after one it extends", async () => {
		const found = await messages({ User, CurrentUser, Response: { title: "Response", anyOf: [reference("User"), reference("CurrentUser")] } });
		expect(found).toStrictEqual(["`CurrentUser` extends `User`, so it must come before it."]);
	});

	test("checks oneOf as it does anyOf", async () => {
		const found = await messages({ User, CurrentUser, Response: { title: "Response", oneOf: [reference("User"), reference("CurrentUser")] } });
		expect(found).toStrictEqual(["`CurrentUser` extends `User`, so it must come before it."]);
	});

	test("accepts the most specific member first", async () => {
		expect(await messages({ User, CurrentUser, Response: { title: "Response", anyOf: [reference("CurrentUser"), reference("User")] } })).toStrictEqual([]);
	});

	test("finds the properties a member reaches through allOf", async () => {
		const Admin = { title: "Admin", type: "object", allOf: [reference("User")], properties: { role: { type: "string" } }, required: ["role"] };
		const found = await messages({ User, Admin, Response: { title: "Response", anyOf: [reference("User"), reference("Admin")] } });
		expect(found).toStrictEqual(["`Admin` extends `User`, so it must come before it."]);
	});

	test("accepts members neither of which extends the other", async () => {
		const Group = { title: "Group", type: "object", properties: { name: { type: "string" } }, required: ["name"] };
		expect(await messages({ User, Group, Response: { title: "Response", anyOf: [reference("User"), reference("Group")] } })).toStrictEqual([]);
	});

	test("accepts a closed member before one that extends it, since it cannot match the larger body", async () => {
		const Closed = { ...User, title: "Closed", additionalProperties: false };
		expect(await messages({ Closed, CurrentUser, Response: { title: "Response", anyOf: [reference("Closed"), reference("CurrentUser")] } })).toStrictEqual([]);
	});

	test("leaves the order of a discriminated union to its discriminator", async () => {
		const union = { title: "Response", discriminator: { propertyName: "id" }, oneOf: [reference("User"), reference("CurrentUser")] };
		expect(await messages({ User, CurrentUser, Response: union })).toStrictEqual([]);
	});
});
