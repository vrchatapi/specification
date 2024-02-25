![VRChat Spec Banner](https://vrchatapi.github.io/assets/img/spec_banner_1500x400.png)

# 💜 VRChat API Specification 💜

What is this? This is a community-driven "OpenAPI" (formerly  Swagger) specification. OpenAPI allows to define an API in YAML - a both machine and human-readable format - and then do tons of cool stuff with it! While our primary use is automatically generating the website docs from the specification, we can also use it to automatically generate code! Fully working code!

This effort has resulted in several language SDK libraries being available, ideally making the development experience with VRChat's API less painful and avoid duplication in effort. These language SDKs can then be automatically re-generated whenever an update is made to the specification, allowing us to have a single source of truth, and then automatically distribute those changes to all libraries.

## 🔰 Getting Started

This repository is **only** for **defining** the API, and is only interesting if you want to help contribute, of which, we need help! 💖

If you are simply looking to **use** the VRChat API, please instead check out one of the language libraries:

[<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="100">](https://github.com/vrchatapi/vrchatapi-javascript)
[<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="100">](https://github.com/vrchatapi/vrchatapi-python)
[<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" width="100">](https://github.com/vrchatapi/vrchatapi-java)
[<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg" width="100">](https://github.com/vrchatapi/vrchatapi-dart)
[<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg" width="100">](https://github.com/vrchatapi/vrchatapi-rust)
[<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg" width="100">](https://github.com/vrchatapi/vrchatapi-csharp)
(click, they are links!)

Or alternatively check out the Web documentation at https://vrchatapi.github.io/.

## ⚠️ Disclaimer

Before we begin, we would like to state this is a **COMMUNITY DRIVEN PROJECT**.
This means that everything you read on here was written by the community itself and is **not** officially supported by VRChat.
The documentation is provided "AS IS", and any action you take towards VRChat is completely your own responsibility.

The documentation and additional libraries SHALL ONLY be used for applications interacting with VRChat's API in accordance
with their [Terms of Service](https://hello.vrchat.com/legal) and [Community Guidelines](https://hello.vrchat.com/community-guidelines), and MUST NOT be used for modifying the client, "avatar ripping", or other illegal activities.
Malicious usage or spamming the API may result in account termination.
Certain parts of the API are also more sensitive than others, for example moderation, so please tread extra carefully and read the warnings when present.

![Tupper Policy on API](https://i.imgur.com/yLlW7Ok.png)

Finally, use of the API using applications other than the approved methods (website, VRChat application, Unity SDK) is not officially supported.
VRChat provides no guarantee or support for external applications using the API. Access to API endpoints may break **at any time, without notice**.
Therefore, please **do not ping** VRChat Staff in the VRChat Discord if you are having API problems, as they do not provide API support.

## 👋 Get in touch with us!

We will make a best effort in keeping this documentation and associated language libraries up to date, but things might be outdated or missing.
If you find that something is no longer valid, please contact us on Discord or [create an issue](https://github.com/vrchatapi/specification/issues) and tell us so we can fix it.

[![Discord](https://img.shields.io/static/v1?label=vrchatapi&message=discord&color=blueviolet&style=for-the-badge)](https://discord.gg/qjZE9C9fkB)

## 💖 Contributing (Help wanted!)

Do you want to help with documenting the API? The work we do today build upon the work done by predecessors years ago. We are standing on the shoulders of giants. If you help out, then one day people will greatly appreciate the work you've done in helping them to create even greater innovations.

It is beautiful developing API documentation, not only because it will help yourself in your own projects, but because it allows others to create stuff you yourself wouldn't even think of, thereby greatly improving the experience for everyone! If that sounds amazing, please [contact on Discord](https://discord.gg/qjZE9C9fkB) and we can help you get started!
