# VRChat API specification

VRChat publishes no specification. Every path, field, type, and example here is
reverse-engineered from live traffic, so a confident sentence nobody checked is
the failure this repo produces most.

`test/arazzo.yaml` drives ~500 workflows against the live API and writes the
capture to `test/.out/har/arazzo.har`. That capture is the evidence. Query it
before writing anything:

```sh
jq -r '[.log.entries[] | select(.request.url | contains("/users/")) | .response.content.text | fromjson] | .[0]' test/.out/har/arazzo.har
```

## Never document what the traffic has not shown

- Every property, type, enum value, `required` entry, and example comes from a
  captured response. Never add one from a field name, a sibling schema, or the
  client's behaviour.
- A field that is always `null` establishes nothing about its type. Write `{}`
  rather than guessing from the name. Never write a bare `nullable: true`: Ajv
  rejects it without a `type`, and the schema check fails.
- `nullable: true` means JSON `null` was captured. A field that is sometimes
  absent is not nullable.
- Close an `enum` only when the set is known. Two observed values do not make a
  set; a generated client will reject the third.
- `/config` returns decoy properties, plausible-looking names VRChat rerolls at
  random. Never document one, and keep `APIConfig` `additionalProperties: true`.

## Absent from one capture is not absent

Adding needs evidence; removing needs far more. A capture records one account in
one state, and a response changes shape with that state — `presence` carries
nine keys for an offline account and nineteen for an online one.

A property missing from a capture is a coverage gap, not a phantom. Add the
workflow that reaches the state carrying it, and judge the property once that
workflow has run. Deleting on the strength of one capture removes what the
suite merely failed to reach.

## An unevidenced schema is a missing test

`{}`, a value only ever `null`, and a property no response has carried all mean
the same thing: no workflow reaches the case that would settle it. Add the
workflow to `test/arazzo.yaml`; never close the gap by guessing.

`required` cuts both ways. A property every observed response carries but that
`required` omits is either required, or missing the workflow that shows it
absent. A property in `required` that some response omits is neither.

## Guess what to probe, verify before you write it

Documenting only what the traffic has shown is a rule about what reaches a
`description`, not about what you are allowed to think. Inference is how you
find the traffic worth capturing. Guess widely, then let a request settle it.

- An ID prefix names its resource, and a resource with its own prefix usually
  has a collection of its own. `icat` and `ivib` in a validation message
  unpacked to `GET /instanceCategories` and `GET /instanceVibes`, two routes no
  capture had ever touched.
- Send a deliberately wrong value to make the API name the format it wants.
  `categoryId: "x"` answered `categoryId must be a 'icat' ID`.
- Take the spelling from paths the description already carries. VRChat writes
  top-level collections as camelCase plurals: `/avatarStyles`, `/tokenBundles`,
  `/moderationReports`.
- A candidate path an existing route swallows answers with that route's error.
  `/instances/categories` returns the 400 from `getInstance` parsing
  `categories` as `worldId:instanceId`, which rules out every nested spelling
  in one request.
- Read a field where it is populated, not where it is empty. `languages` and
  `userIcons` are `[]` on every instance the suite creates and full on a busy
  public one.
- Probe candidates in a batch and read the status codes. A 200 establishes a
  route.

An inference no request settles stays out of the description. Say it to the
user as an open question instead.

## Check with curl, document from a workflow

One `curl` answers what a route does now, without running the suite. The session
cache holds the cookie:

```sh
curl -s -A "specification-test/1 (https://vrchat.community)" \
	-b "auth=$(cat test/.out/session)" \
	https://api.vrchat.cloud/api/1/economy/stores
```

Use it to check a single route, to confirm what a capture only implies, or to
separate an API behaviour from a tooling artifact: when curl and the suite
disagree on the same URL, the client differs, not VRChat.

A curl records one moment. Never write a description from one alone. Add the
workflow to `test/arazzo.yaml`, then document what it captures.

## A "not implemented" 404 means no route matched

VRChat answers `{"error":"The endpoint you're looking for is not implemented by
our system."}` when no route matches. A removed endpoint and a malformed path
both produce it: `/api/1//css/app.css` and a percent-encoded dot return it
byte-for-byte. This body never establishes that a route is gone. Request the
exact path directly before marking anything deprecated.

## One operation per workflow

A failing step ends its workflow, so every operation after it goes unexercised
and its coverage disappears without saying so. Give each operation its own
workflow. Chain steps only where a later one needs state an earlier one created:
a create-read-delete lifecycle belongs together, a run of independent reads does
not.

## Descriptions state what the API does

- Never write about the evidence. No "observed", "unverified", "appears to",
  "not established", "no other value seen".
- Never assert what the wire cannot show: lifetimes, units, defaults, causes,
  what the client does with a value.
- State a rule once. Where a response component explains a status code, the
  operations returning it stay silent.

## Examples are copied, never typed

Copy the body from the capture verbatim. VRChat substitutes lookalike
characters in validation messages — `˸` (U+02F8) for a colon, `‚` (U+201A) for a
comma, `․` (U+2024) for a full stop — and a retyped example normalises them,
which is how you can tell nobody captured it.

## Deprecation and deletion

Mark `x-deleted: <date>` only where every observed call answers the generic
"not implemented" 404. Keep the operation and its tag: the published bundles
drop it, the `test` bundle keeps it, so the suite goes on calling the route and
a revival shows up as a failing `not-found` workflow.

The date is the day the route started answering that 404, which the suite now
records the morning it happens. For a route that died before the suite existed,
`vrchatapi/specification-test` commits one response file per operation daily
back to 2023, so `git log -S '\`404 Not Found\`'` over the file dates it. Where
neither covers the route, fall back to the day it was marked and say no more
than that. Never date one from `vrchatapi/monitor`: a path outlives its endpoint
in the client bundle, and `/economy/seller/eligibility` sat there months after
it stopped answering.

Mark `deprecated: true` where the route still answers but VRChat has replaced
it or the client no longer uses it. Keep the original tag and add `deprecated`.

An operation id is a public URL. `vrchat.community/reference/<kebab-case-id>`
is what the changelogs, the release notes and every link anyone has saved point
at, and generated clients take their method names from the same string. Renaming
or deleting one breaks all of that, so open a matching PR on
`vrchatapi/vrchat.community` adding a redirect from the old id before the rename
lands, and fix the links in any release notes that named it.

## Comments

Never add a YAML comment. A fact about the API belongs in a `description`.

## Traps

- `respect` closes any schema that omits `additionalProperties`, so a genuinely
  open one must say `additionalProperties: true`. The `vrchat/close-schemas`
  decorator changes `drift` only, and does not reach the schema check.
- `respect` masks secrets in the capture and sends the real value. `********` in
  a HAR is evidence about nothing.
- `dist/openapi-test.yaml` defines `jsonschema` and `internal`, so `x-if` takes
  its `then` branch. The published bundles take `else`. Both must describe the
  same traffic; check which one you are validating against before believing a
  finding.
- `drift`'s `security-baseline` flags every unauthenticated workflow for the
  missing cookie it exists to assert. Every finding it produces is a 401 and
  none is actionable.
- A `oneOf` that matches no branch reports every property in the body as
  unevaluated, so one missing property produces hundreds of findings naming
  innocent ones. Fix the branch that should have matched, never the properties
  the finding names.
- `respect` rejects `--skip` alongside `--workflow`, and runs only what you name,
  so an authenticated workflow needs `-w session` too, and `-w login` as well
  when `test/.out/session` is missing or stale.
- The suite resolves `operationId` against the bundle, so a new path needs an
  entry in `openapi/components/paths.yaml` as well as its file under
  `openapi/components/paths/`. Without it every step naming the operation fails
  as `Unknown operationId`.
- `pnpm test` validates against `dist/`, never `openapi/`. Run `pnpm bundle`
  first: a stale bundle passes checks the current schema fails, and hides the
  schema drift a fresh one reports.
- A `-w` run writes `test/.out/partial.har` and leaves the suite capture alone.
  `coverage` and `drift` read the suite capture, so run them after a full run.
- A response file may already serve another operation. Check with `grep -rn`
  before rewriting one: overwriting `FavoriteGroupListResponse.yaml` for a new
  route silently broke the three workflows `getFavoriteGroups` runs through it.
- One `schema check` message carries every failure the step found, separated by
  code frames. Reading only the first hides the rest, so three undocumented
  properties get found one suite run apart instead of together.
- Ajv reports `unevaluatedProperties` at the outermost object that fails and does
  not descend, so fixing a property on a shelf can reveal others nested under it.
  `drift` and the suite's schema check disagree on which they name.
- `jq`'s `gsub` over a multi-megabyte string takes minutes. A coloured code frame
  in a check message reached 14MB. Filter lines by substring before any regex
  touches them.

## Commands

| | |
| --- | --- |
| `pnpm bundle` | build `dist/` |
| `pnpm lint` | spectral, eslint, arazzo |
| `pnpm test` | drive the suite against the live API |
| `pnpm test -w session -w <workflowId>` | one workflow, plus the session it reads |
| `pnpm test:coverage` | what the traffic never reached |
| `pnpm test:drift` | where traffic and description disagree |
| `sh test/report.sh` | the last run's failures as Markdown |
| `sh test/report.sh --format github` | the same, as CI annotations |

`pnpm test` reuses the cached session in `test/.out/`; delete
`test/.out/session` to force a fresh login.

`oasdiff` (`~/go/bin/oasdiff`) diffs a release bundle against `dist/`. Read
`docs/writing-changelogs.md` before writing release notes.

## A second account settles what one cannot

`presence` has a legacy shape and a current one, and which you get depends on the
account. `themes`, `worldFavoriteLists` and the frontend branches are empty on the
test account and populated elsewhere. When a field resists the suite, ask a user
for their `/auth/user` body and validate it against `dist/openapi-test.yaml`.
`docs/next.md` carries the snippet that collects one.
