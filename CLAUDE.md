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

## Deprecation

Mark `deprecated: true` only where every observed call answers the generic
"not implemented" 404. Keep the original tag and add `deprecated`, so the suite
keeps calling the route and a revival shows up.

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
  so an authenticated workflow needs `-w session` too.
- A `-w` run writes `test/.out/partial.har` and leaves the suite capture alone.
  `coverage` and `drift` read the suite capture, so run them after a full run.
- Some files under `openapi/components/paths/` are CRLF. Read a diff of one with
  `git diff --ignore-all-space` before believing its size.

## Commands

| | |
| --- | --- |
| `pnpm bundle` | build `dist/` |
| `pnpm lint` | spectral, eslint, arazzo |
| `pnpm test` | drive the suite against the live API |
| `pnpm test -w session -w <workflowId>` | one workflow, plus the session it reads |
| `pnpm test:coverage` | what the traffic never reached |
| `pnpm test:drift` | where traffic and description disagree |

`pnpm test` reuses the cached session in `test/.out/`; delete
`test/.out/session` to force a fresh login.
