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
	# A `goto` failure action runs its target as a nested workflow, which respect
	# records among the steps it jumped from rather than beside them. Only the
	# leaves carry checks, so a cleanup that fails would go unreported.
	def leaves: .executedSteps[] | if .type == "workflow" then leaves else . end;
	[
		.files[].executedWorkflows[]
		| .workflowId as $workflow
		| leaves
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
	# A schema check reports what failed, sometimes the values it would have
	# accepted, then a code frame quoting the whole response body. The prose is
	# what is worth reading, so take lines until the frame starts.
	#
	# The frame colours every line: one message came to 14MB, holding an escape
	# sequence for each, and stripping those from the whole string rebuilds it
	# once per escape and takes minutes. Cut to a prefix before the regex.
	| def detail:
		# Ajv shouts the keyword it failed on.
		def tidy:
			sub("^REQUIRED must have required property "; "missing required property ")
			| sub("^UNEVALUATEDPROPERTIES must NOT have unevaluated properties: "; "undocumented property ")
			| sub("^ENUM must be equal to one of the allowed values"; "not one of the allowed values")
			| sub("^TYPE "; "")
			| sub("\\.$"; "");
		if .condition then .condition
		else
			[
				(.message // "")
				| split("\n")[]
				# Every line of a code frame carries a gutter, and a frame can run
				# to megabytes. Finding the prose by substring rather than by regex
				# is what keeps that affordable: the same lines, ninety times faster.
				| select(index("|") | not)
				| gsub("\u001b\\[[0-9;]*m"; "")
				| select(test("\\S"))
			]
			# One message can carry several failures, each opening with the keyword
			# Ajv failed on. Anything else continues the failure above it, whether
			# that is the values it would have taken or a sentence on the cause.
			# Ajv repeats a failure once per element it rejected, and the same
			# wording twice says nothing the first did not.
			| map(sub("^ +"; "") | sub(" +$"; ""))
			| reduce .[] as $line (
				[];
				if (length > 0) and (($line | test("^[A-Z][A-Z]")) | not)
				then .[0:-1] + [.[-1] + " " + $line]
				else . + [$line]
				end
			)
			| map(tidy)
			| reduce .[] as $item ([]; if index([$item]) then . else . + [$item] end)
			| join("; ")
		end;
	def rows($severity):
		[
			$steps[]
			| . as $step
			| .checks[]
			| select(.severity == $severity)
			| $step + {check: .name, detail: detail}
		];
	# The annotation already points at the step, so its name would only repeat
	# the line it sits on. The check name is worth printing when it carries no
	# detail of its own.
	def summary:
		if .detail == "" then .check else .detail end;

	# Failures run long enough that no table column can hold them. A workflow can
	# fail several steps, and a step several checks, so each nests under the one
	# it belongs to rather than repeating it.
	def markdown:
		def unique_in_order: reduce .[] as $item ([]; if index([$item]) then . else . + [$item] end);
		def entries($severity):
			[
				rows($severity)
				| group_by(.workflow)[]
				| ["- **\(.[0].workflow)**"]
				+ [
					group_by(.step)[]
					| ["  - `\(.[0].step)`"]
					+ [
						group_by([.code, .method, .path])[]
						| ["    - `\(.[0].code) \(.[0].method) \(.[0].path)`"]
						+ ([.[] | summary | split("; ")[]] | unique_in_order | map("      - \(.)"))
					]
				]
			]
			| flatten;
		def plural($n; $noun): "\($n) \($noun)\(if $n == 1 then "" else "s" end)";
		def section($title; $severity):
			entries($severity) as $entries
			| rows($severity) as $rows
			| if ($entries | length) == 0 then empty
			else
				[
					"### \($title) (\(plural($rows | map(.workflow) | unique | length; "workflow")), \(plural($rows | length; "check")))",
					""
				]
				+ $entries
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
	#
	# GitHub heads each annotation with the step that emitted it, so a title only
	# repeats that. The workflow, the check and the request go in the body.
	def github:
		def message: gsub("%"; "%25") | gsub("\r"; "%0D") | gsub("\n"; "%0A");
		def command($level; $severity):
			rows($severity) as $all
			| [
				$all[0:10][]
				| ($lines[.workflow + "\t" + .step] // 0) as $line
				| (if $line == 0 then "" else ",line=\($line)" end) as $anchor
				| ("\(.workflow): \(summary) — \(.code) \(.method) \(.path)" | message) as $body
				| "::\($level) file=test/arazzo.yaml\($anchor)::\($body)"
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
