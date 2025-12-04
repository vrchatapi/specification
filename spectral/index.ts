/* eslint-disable no-console */
/**
 * Spectral's CLI has some issues with resolving nested $refs, causing it to
 * lose track of the source file in certain situations.
 *
 * This is a workaround for that.
 *
 * @see https://github.com/stoplightio/spectral/issues/2007
 */

import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { cwd, env, exit } from "node:process";
import { parseArgs } from "node:util";

import { error, notice, summary, warning } from "@actions/core";
import { Document, Ruleset, Spectral } from "@stoplight/spectral-core";
import Parsers from "@stoplight/spectral-parsers";

import { defaultRuleset } from "./ruleset";

const { values: { only = [], except = [], ci, fail }, positionals } = parseArgs({
	args: Bun.argv.slice(2),
	strict: true,
	allowPositionals: true,
	options: {
		only: {
			type: "string",
			multiple: true,
		},
		except: {
			type: "string",
			multiple: true,
		},
		ci: {
			type: "boolean",
			default: "CI" in env,
			short: "i",
		},
		fail: {
			type: "string",
			default: "0",
			short: "f",
		}
	}
});

const commandBySeverity = {
	0: error,
	1: warning,
	2: notice,
	3: notice,
};

const filename = resolve(cwd(), positionals[0] || "");

// eslint-disable-next-line antfu/no-top-level-await
await execute(filename, { only, except, ci, failSeverity: Number.parseInt(fail) });

interface ExecuteOptions {
	only: Array<string>;
	except: Array<string>;
	ci: boolean;
	failSeverity: number;
}

async function execute(filename: string, { only, except, failSeverity, ci }: ExecuteOptions) {
	const spectral = new Spectral();
	spectral.setRuleset(new Ruleset(defaultRuleset, { source: filename }));

	if (except.length > 0)
		for (const rule of except)
			delete spectral.ruleset?.rules?.[rule];

	if (only.length > 0) {
		Object.assign(spectral.ruleset || {}, {
			rules: Object.fromEntries(Object.entries(spectral.ruleset?.rules ?? {}).filter(([key]) => only.includes(key)))
		});
	}

	const ruleNames = Object.keys(spectral.ruleset?.rules ?? {}).sort();
	console.log(`using Spectral with ${ruleNames.length} rules:`);
	console.log(ruleNames.map((r) => `- ${r}`).join("\n"));
	console.log(`on file: ${filename}`);

	const document = new Document(await readFile(filename, "utf8"), Parsers.Yaml, filename);
	const diagnostics = await spectral.run(document);

	const failed = diagnostics.filter(({ severity }) => severity <= failSeverity).length > 0;

	if (!ci) {
		const { stylish } = await import("@stoplight/spectral-formatters");

		console.log(stylish(diagnostics, { failSeverity }));
		if (failed) exit(1);

		return;
	}

	summary.addHeading("Spectral lint");
	summary.addRaw(`${diagnostics.length} issue(s).`, true);
	summary.addBreak();

	const diagnosticsBySource = diagnostics.reduce((acc, diag) => {
		const file = diag.source || "<unknown>";
		if (!acc[file]) acc[file] = [];
		acc[file].push(diag);
		return acc;
	}, {} as Record<string, typeof diagnostics>);

	summary.addHeading("By file", 2);
	summary.addRaw(`${Object.keys(diagnosticsBySource).length} file(s) with issues.`, true);
	summary.addBreak();

	for (const [source, diagnostics] of Object.entries(diagnosticsBySource)) {
		const pathname = relative(cwd(), source);

		summary.addHeading(pathname, 3);
		summary.addRaw(`${diagnostics.length} issue${diagnostics.length === 1 ? "" : "s"}.`, true);

		summary.addList(diagnostics.map(({ code, message, range: { start } }) => {
			const href = `${pathname}#L${start.line + 1}`;
			return `(<a href="${href}">view</a>) ${message} <code>[${code}]</code>`;
		}));
	}

	diagnostics.map(({ severity, code, message, source = "", range: { start, end } }) => {
		const file = relative(cwd(), source);

		return commandBySeverity[severity](message, {
			title: code.toString(),
			file,
			startLine: start.line + 1,
			startColumn: start.character + 1,
			endLine: end.line + 1,
			endColumn: end.character + 1,
		});
	});

	if (env.GITHUB_STEP_SUMMARY)
		await summary.write();

	if (failed) exit(1);
}
