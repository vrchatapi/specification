#!/bin/sh
# Renders the last run's JSON report, as Markdown for GitHub's step summary or
# as workflow commands that annotate the workflow which failed.
#
# respect names the check that failed but not the request behind it, so a CI log
# says `status code check` and leaves you to find the URL and the status code
# yourself. The JSON report carries both.
#
#   sh test/report.sh >> "$GITHUB_STEP_SUMMARY"
#   sh test/report.sh --format github
set -eu

cd "$(dirname "$0")/.."

format=markdown
if [ "${1:-}" = "--format" ]; then
	format="$2"
	shift 2
fi

report="${1:-test/.out/respect.json}"
[ -s "$report" ] || exit 0

# respect records no line numbers, so an annotation has to find its own. A
# workflow and step id are unique together, and both keys sit at a fixed depth.
lines=$(awk '
	/^  - workflowId: / { workflow = $3; next }
	/^      - stepId: / { printf "%s\t%s\t%d\n", workflow, $3, NR }
' test/arazzo.yaml | jq -R -s '
	split("\n")
	| map(select(length > 0) | split("\t"))
	| map({key: (.[0] + "\t" + .[1]), value: (.[2] | tonumber)})
	| from_entries
')

jq -r --argjson lines "$lines" --arg format "$format" '
	[
		.files[].executedWorkflows[]
		| .workflowId as $workflow
		| .executedSteps[]
		| {
			workflow: $workflow,
			step: .stepId,
			method: ((.request.method // "?") | ascii_upcase),
			path: ((.request.url // "") | sub("^https?://[^/]+"; "")),
			code: (.response.statusCode // 0),
			checks: [.checks[] | select(.passed | not)],
		}
		| select(.checks | length > 0)
	] as $steps
	| ([.files[].executedWorkflows[]] | length) as $total
	# A schema check reports a multi-line code frame, coloured, and the frame
	# quotes the whole response body: one ran to 57MB in CI. Only the first line
	# names the property, and a table cell holds one line, as does an annotation
	# title, so cut to a bounded prefix before any regex touches it.
	| def detail:
		if .condition then .condition
		else
			[
				((.message // "")[0:2000] | gsub("\u001b\\[[0-9;]*m"; ""))
				| split("\n")[]
				| select(test("\\S"))
			][0] // ""
		end;
	def rows($severity):
		[
			$steps[]
			| . as $step
			| .checks[]
			| select(.severity == $severity)
			| $step + {check: .name, detail: detail}
		];
	def summary:
		"\(.check)\(if .detail == "" then "" else ": " + .detail end)";

	def markdown:
		def cell: gsub("\\|"; "\\\\|");
		def table($severity):
			[
				rows($severity)[]
				| "| `\(.workflow)` | `\(.step)` | `\(.code) \(.method) \(.path)` | \(summary | cell) |"
			];
		def section($title; $severity):
			table($severity) as $table
			| if ($table | length) == 0 then empty
			else
				["### \($title) (\($table | length))", "", "| Workflow | Step | Response | Check |", "| --- | --- | --- | --- |"]
				+ $table
				+ [""]
			end;
		([section("Failures"; "error"), section("Warnings"; "warn")] | flatten) as $sections
		| if ($sections | length) == 0 then ["All \($total) workflows passed."] else $sections end;

	# https://docs.github.com/actions/reference/workflow-commands-for-github-actions
	#
	# GitHub shows ten annotations of each level per step and drops the rest, but
	# the runner calls its API for every one it is given. A run whose session
	# failed fails every workflow it has, so this cap is what keeps the step from
	# spending minutes on annotations nobody will see. The summary keeps them all.
	def github:
		def message: gsub("%"; "%25") | gsub("\r"; "%0D") | gsub("\n"; "%0A");
		def property: message | gsub(":"; "%3A") | gsub(","; "%2C");
		def command($level; $severity):
			rows($severity) as $all
			| [
				$all[0:10][]
				| ($lines[.workflow + "\t" + .step] // 0) as $line
				| (if $line == 0 then "" else ",line=\($line)" end) as $anchor
				| ("\(.workflow) / \(.step)" | property) as $title
				| ("\(summary) — \(.code) \(.method) \(.path)" | message) as $body
				| "::\($level) file=test/arazzo.yaml\($anchor),title=\($title)::\($body)"
			]
			+ (
				if ($all | length) > 10
				then ["::notice::\(($all | length) - 10) further \($severity) checks, listed in the run summary."]
				else []
				end
			);
		command("error"; "error") + command("warning"; "warn");

	(if $format == "github" then github else markdown end)
	| .[]
' "$report"
