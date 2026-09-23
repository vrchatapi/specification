# redocly-plugin-downlevel

A [Redocly](https://redocly.com/docs/cli/) plugin that rewrites an OpenAPI 3.x description as an earlier 3.x release, for tools that cannot read the version it is written in: code generators, gateways, validators pinned to 3.0.

It lowers one release at a time, 3.2.1 → 3.2.0 → 3.1.2 → 3.1.1 → 3.1.0 → 3.0.4 → 3.0.3 → 3.0.2 → 3.0.1 → 3.0.0, and fails the bundle, pointing at the file and line, wherever the target release cannot say what the description says.

## Install

```sh
npm install --save-dev redocly-plugin-downlevel
```

It needs `@redocly/cli` (or `@redocly/openapi-core`) 2.53.3 or later, and Node.js 22 or later.

## Use

```yaml
# redocly.yaml
plugins:
  - redocly-plugin-downlevel

apis:
  legacy:
    root: openapi.yaml
    output: dist/openapi-3.0.yaml
    decorators:
      downlevel/openapi:
        version: "3.0"
```

```sh
redocly bundle legacy
```

| option | | |
| --- | --- | --- |
| `version` | required | The release to write, such as `"3.0.3"`, or a minor version such as `"3.0"`, which means its latest release. Quote it: YAML reads an unquoted `3.0` as the number 3. |
| `loosenUnions` | default `false` | Replace every `oneOf` and `anyOf` with one schema that accepts everything its members accept. For readers that cannot take unions at all; see [Loosening unions](#loosening-unions). |

The decorator runs once bundling has finished, so every `$ref` it meets is internal to the bundle. Put it on the APIs that need the older version and leave the others on the source.

## What happens to a construct

Each layer does one of three things with a construct the release below it lacks:

- **rewrite** it into the form the lower release uses, when that form means the same: `type: [string, "null"]` becomes `type: string` with `nullable: true`. Where the lower release has no field for it, the form is the extension its readers take the same thing from: the [OAI extension registry](https://spec.openapis.org/registry/extension/index.html)'s `x-oai-*` and `x-jsonschema-*` entries, and extensions the wider ecosystem reads, such as `x-displayName`. Every extension a reader uses is written, and one the description already carries is kept.
- **drop** it, when it is an annotation or hint whose absence changes nothing a reader validates: `info.summary`, `servers[].name`, a discriminator's `defaultMapping`.
- **report** it, when the lower release cannot say it, no extension carries it, and any rewrite would change what the description accepts or means: `prefixItems`, `in: querystring`, a `oneOf` that must admit `null`. A report is an error, so the bundle is not written. A construct written as an extension keeps its meaning for readers of that extension; a validator that knows none of them accepts more than the source does.

A layer runs all its checks first, so every problem in a release is reported at once, then its rewrites.

### 3.2 → 3.1

| construct | done |
| --- | --- |
| Tag `summary` | written as the tag's `x-displayName` |
| Tag `parent` | written as `x-tagGroups`: one group per top-level tag, holding it and every tag beneath it, since a renderer leaves out any tag no group names |
| Tag `kind: badge` | written as an `x-badges` entry on each operation carrying the tag, which stays out of `x-tagGroups` |
| Response `summary` | written as `x-oai-summary` and `x-summary` |
| `$self`, `servers[].name`, Security Scheme `deprecated` | written as `x-oai-$self`, `x-oai-name`, `x-oai-deprecated` |
| any other Tag `kind`, Security Scheme `oauth2MetadataUrl`, Discriminator `defaultMapping`, Media Type `description` | dropped |
| Example `dataValue` / `serializedValue` | written as `value`; `serializedValue` also as `x-oai-serializedValue` |
| Path Item `query`, `additionalOperations` | written as `x-oai-additionalOperations`, `query` under `QUERY` |
| Media Type `itemSchema`, `prefixEncoding`, `itemEncoding`; Encoding `encoding`, `itemEncoding` | written as their `x-oai-*` extensions |
| OAuth `deviceAuthorization` and its `deviceAuthorizationUrl` | written as `x-oai-deviceAuthorization` and `x-oai-deviceAuthorizationUrl` |
| XML `nodeType` | written as `attribute` / `wrapped`; `text`, `cdata`, and `none` on a scalar are reported |
| `components.mediaTypes` and Media Type `$ref`s | inlined |
| a Security Requirement naming its scheme by URI | the component name, when the URI points into this document's components; otherwise reported |
| the 3.2 schema dialect in `jsonSchemaDialect` or `$schema` | the 3.1 base dialect |
| `style: deepObject` | `explode: true` written out, the only combination 3.1 defines |
| `example` / `examples` beside a Parameter's or Header's `content` | moved into its Media Type Object |
| `allowReserved: false` beyond `in: query` | dropped |
| a Response without `description` | `description: ""` |
| `in: querystring`; `style: cookie`; `allowReserved: true` beyond `in: query`; Encoding `prefixEncoding`; `encoding` outside a request body; `schema` on a sequential media type; an array `schema` for `multipart/form-data`; a non-ASCII XML `namespace` | reported |

### 3.1 → 3.0

| construct | done |
| --- | --- |
| `type: [X, "null"]` | `type: X`, `nullable: true` |
| `type` naming several types | `anyOf` with one member per type |
| a `null` member of `oneOf` / `anyOf` | `nullable` on one other member, so `null` still matches exactly one; a reference gets `nullable: true` beside its `$ref` (see [Nullable references](#nullable-references)); reported for a `oneOf` where another member already takes `null` |
| numeric `exclusiveMinimum` / `exclusiveMaximum` | the limit in `minimum` / `maximum`, the flag `true`; the tighter bound where both are given |
| schema `examples` | `example: examples[0]`, and the list as `x-jsonschema-examples` |
| `const` | `enum: [value]` |
| `contentEncoding`, `contentMediaType`, `contentSchema` | written as their `x-jsonschema-*` extensions; `base64` and `application/octet-stream` also as `format: byte` and `format: binary` |
| boolean schemas | `{}` and `{not: {}}` |
| keywords beside a schema `$ref` that constrain it | the reference moved into `allOf` |
| `type: array` without `items`, empty `required`, empty `enum` | `items: {}`, removed, `not: {}` |
| an untyped multipart part | `type: string`, `format: binary` |
| `components.pathItems` | inlined |
| `license.identifier`, Schema `$anchor` | written as `x-oai-license-identifier`, `x-jsonschema-$anchor` |
| `contains`, `minContains`, `maxContains`, `if`/`then`/`else`, `dependentSchemas`, `patternProperties`, `propertyNames`, `unevaluatedProperties` | written as their `x-jsonschema-*` extensions, once the schemas inside them are lowered |
| `webhooks` | written as `x-webhooks` |
| `jsonSchemaDialect`, `info.summary`, `$schema`, `$id`, `$comment` and the other identifiers, a `nullable` 3.1 ignores | dropped |
| an empty path item whose template has no path parameter | dropped |
| no `paths` | `paths: {}` |
| `prefixItems`, `unevaluatedItems`, `dependentRequired`, `$dynamicRef`, `$defs` and the other keywords 3.0 has no extension for; `mutualTLS`; an operation without `responses`; a `default` that does not match `type`; `readOnly` with `writeOnly`; a `$ref` fragment that is not a JSON Pointer; roles for a scheme other than OAuth 2 or OpenID Connect; a `requestBody` on GET, HEAD or DELETE; a link into `webhooks`; a relative metadata URL; `style` / `explode` / `allowReserved` in multipart | reported |

### Patch releases

Patch releases add no fields, but some changed what a description means. Where the earlier release can be told the later meaning, the layer writes it out; where it cannot, it reports.

| layer | done |
| --- | --- |
| 3.2.1 → 3.2.0 | names the 3.2 dialect, which 3.2.0 would take as 3.1's; reports `prefixEncoding`/`itemEncoding` without an array or `itemSchema`, and array `multipart/form-data` schemas |
| 3.1.1 → 3.1.0 | writes `encoding.contentType: application/json` for object properties of form bodies; reports relative metadata URLs and XML namespaces with a fragment |
| 3.0.4 → 3.0.3 | the same, plus `application/octet-stream` for `format: byte` multipart parts; reports `spaceDelimited`/`pipeDelimited` objects |
| 3.1.2 → 3.1.1, 3.0.3 → 3.0.2, 3.0.2 → 3.0.1, 3.0.1 → 3.0.0 | the version only |

Some patch releases changed how a value is serialized on the wire, correcting what the earlier text got wrong: percent-encoding of header values (3.1.2), `label` style with `explode: false` and the meaning of `allowEmptyValue` (3.0.4, 3.1.1). A description has no field in which to pin those, so they are not carried.

## Loosening unions

With `loosenUnions`, each `oneOf` and `anyOf` becomes one schema that accepts everything any member accepts:

1. A `null` member makes the result nullable. One member left is the result; a reference stays a reference.
2. Members that each allow only listed values, by `enum` or `const`, become one `enum`, as openapi-generator's `SIMPLIFY_ONEOF_ANYOF_ENUM` rule reads them: a single value's `title` and `description` go to `x-enum-descriptions` and its `deprecated` to `x-enum-deprecated`.
3. Other members of one type merge. An object carries every member's properties and requires only what every member requires; an array loosens its `items`; a keyword survives when every member gives it the same value, and `enum` becomes the union of the members' values.
4. Members of different types leave `{}`.

The union's own `title` and `description` carry over, so a code generator names the merged object after the union.

## Nullable references

3.1 writes a nullable reference as `anyOf: [{$ref: X}, {type: "null"}]`. 3.0 has only `nullable`, which widens a `type` written beside it, and a reference has none. The plugin writes `$ref: X` with `nullable: true` beside it.

The 3.0 text says keywords beside a `$ref` are ignored, so by the letter this pair accepts no `null`. openapi-generator reads it as a nullable reference, and writes the same pair itself when it simplifies that `anyOf` ([`ModelUtils.java`](https://github.com/OpenAPITools/openapi-generator/blob/v7.25.0/modules/openapi-generator/src/main/java/org/openapitools/codegen/utils/ModelUtils.java#L2597-L2625), on by default). It is the form 3.0 descriptions have used for nullable references in practice.

## Limits

- Redocly resolves a `$ref` inside `example` as a reference in every version, so a literal example object holding `$ref` never reaches the plugin.
- Redocly 2.53.3 and 2.54.2 cannot read a 3.2 description whose `deviceAuthorization` flow has scopes: `@redocly/openapi-core` types `DeviceAuthorization.scopes` as `mapOf('string')`, which throws `Unknown type name found: string`.
- The output is only as valid as the input. Linting the result at the version it declares (`redocly lint --extends minimal`) is the check that nothing slipped through.

## Tests

`pnpm test` runs the unit tests beside each layer and the fixture tests, which downlevel every sample description in `fixtures/` to every earlier release, with and without `loosenUnions`, snapshot each result, and fail if any output has a lint error its source did not.

The fixtures are the OpenAPI Initiative's own examples, vendored with attribution; see `fixtures/*/NOTICE`. `scripts/vendor-fixtures.sh` refreshes them from pinned commits.

## License

MIT. The fixtures keep their own licenses: Apache 2.0 for `fixtures/oai`, CC BY 4.0 for `fixtures/learn`.
