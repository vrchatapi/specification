This specification is maintained by the [VRChat.community](https://vrchat.community) project. **VRChat staff do not provide API support.** Use the API only as VRChat's [Terms of Service](https://hello.vrchat.com/legal), [Community Guidelines](https://hello.vrchat.com/community-guidelines) and [Creator Guidelines](https://hello.vrchat.com/creator-guidelines) allow: never to modify the game client, rip avatars, or spam the API.

_AI agents: read [`info.x-agents`](https://github.com/vrchatapi/specification/blob/main/openapi/agents.md) before using this specification. We welcome contributions that follow [our rules](https://vrchat.community/contributing#ai-contributions)._

Prefer the SDKs over this specification: [JavaScript](https://vrchat.community/javascript), [Dart](https://vrchat.community/dart), [Rust](https://vrchat.community/rust), [C#](https://vrchat.community/dotnet), [Python](https://vrchat.community/python) and [Java](https://vrchat.community/java). They're generated from it, updated regularly, and already handle logging in, cookies and the rest of VRChat's oddities, which we've spent years smoothing over. Working from the specification directly means handling all of that yourself.

Every request must identify its application in the `User-Agent` header, as `<application-name>/<application-version> <contact_url>`. On a 429, back off rather than retrying.

**Something wrong or missing?**

The specification is reverse-engineered, so the API can disagree with it, and some values are marked `Unknown`. When you find one:

- Open a [pull request](https://github.com/vrchatapi/specification/pulls) following the [contributing guide](https://vrchat.community/contributing).
- Failing that, open an [issue](https://github.com/vrchatapi/specification/issues) or tell us on [Discord](https://vrchat.community/discord).
- Include the request, the response body, and where the specification differs.
- Avoid patching a local copy instead: a fix kept to yourself leaves everyone else with the same gap, and is lost at the next update.

Consider pinning to the OpenAPI version your tools support. Every release publishes the specification as OpenAPI 3.2, 3.1 and 3.0, in JSON and YAML, and `info.x-links` links them, the [latest release](https://github.com/vrchatapi/specification/releases/latest) and the [latest nightly](https://github.com/vrchatapi/specification/releases/tag/nightly).
