import { readdirSync } from "node:fs";
import path from "node:path";

import { BaseResolver, bundle, createConfig, lintFromString } from "@redocly/openapi-core";
import type { NormalizedProblem } from "@redocly/openapi-core";
import { describe, expect, test } from "bun:test";

import plugin from "./index.ts";
import { layers } from "./layers.ts";

const root = path.join(import.meta.dirname, "..", "fixtures");

const heldOut: Record<string, string> = {
	"oai/3.2/security-scheme-object-examples.yaml":
		"Redocly cannot read it: `@redocly/openapi-core` types `DeviceAuthorization.scopes` as `mapOf('string')`, and a non-empty scope map throws `Unknown type name found: string`."
};

function offline() {
	return new BaseResolver({ http: { headers: [], customFetch: async () => new Response(null, { status: 503, statusText: "offline" }) } });
}

const fixtures = readdirSync(root, { recursive: true, encoding: "utf8" })
	.filter((file) => file.endsWith(".yaml"))
	.map((file) => file.split(path.sep).join("/"))
	.sort();

function below(version: string): Array<string> {
	const releases: Array<string> = [];
	for (let layer = layers.find((candidate) => candidate.version === version); layer; layer = layers.find((candidate) => candidate.version === layer!.writes))
		releases.push(layer.writes);
	return releases;
}

async function downlevel(file: string, options?: { version: string; loosenUnions: boolean }) {
	const config = await createConfig({ plugins: [plugin()], decorators: options ? { "downlevel/openapi": options } : {} });
	const { bundle: result, problems } = await bundle({ ref: path.join(root, file), config, externalRefResolver: offline() });
	return {
		document: result.parsed as Record<string, unknown>,
		problems: problems.filter(({ ruleId }) => ruleId === "downlevel/openapi").map(({ message, location }) => ({ message, pointer: location[0]?.pointer }))
	};
}

const lintConfig = await createConfig({ extends: ["minimal"] });

async function lintErrors(document: Record<string, unknown>) {
	const problems = await lintFromString({ source: JSON.stringify(document), absoluteRef: path.join(root, "linted.json"), config: lintConfig, externalRefResolver: offline() });
	return new Set(problems.filter(({ severity }) => severity === "error").map((problem: NormalizedProblem) => `${problem.ruleId} ${problem.location[0]?.pointer} ${problem.message}`));
}

const withoutVersion = ({ openapi: _, ...document }: Record<string, unknown>) => document;

describe("fixtures", () => {
	for (const file of fixtures) {
		if (heldOut[file]) {
			test.skip(`${file}: ${heldOut[file]}`, () => {});
			continue;
		}

		test(file, async () => {
			const source = await downlevel(file);
			const releases = below(String(source.document.openapi));
			const introduced: Array<string> = [];
			const snapshot: Record<string, unknown> = {};
			let previous: { version: string; document: Record<string, unknown>; problems: unknown; loosened: unknown } | undefined;

			const sourceErrors = await lintErrors(source.document);

			for (const version of releases) {
				const plain = await downlevel(file, { version, loosenUnions: false });
				const loosened = await downlevel(file, { version, loosenUnions: true });

				for (const { document, problems } of [plain, loosened]) {
					if (problems.length > 0) continue;
					for (const error of await lintErrors(document)) if (!sourceErrors.has(error)) introduced.push(`${version}: ${error}`);
				}

				const loosenedEntry = Bun.deepEquals(loosened, plain) ? "unchanged" : loosened;
				const sameDocument = previous !== undefined && Bun.deepEquals(withoutVersion(previous.document), withoutVersion(plain.document));
				const sameEntry = sameDocument && Bun.deepEquals(previous!.problems, plain.problems) && Bun.deepEquals(previous!.loosened, loosenedEntry);

				snapshot[version] = sameEntry
					? `as ${previous!.version}`
					: { problems: plain.problems, document: sameDocument ? `as ${previous!.version}` : plain.document, loosened: loosenedEntry };
				previous = { version, document: plain.document, problems: plain.problems, loosened: loosenedEntry };
			}

			expect(introduced).toStrictEqual([]);
			expect(snapshot).toMatchSnapshot();
		}, 60_000);
	}
});
