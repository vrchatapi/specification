# Release Notes

Lines with "!:" are to some degree code-**breaking**. Lines with ":" should not be breaking.

## 1.4.0

* feature!: allow editing of all 4 invite message types (#77)
* feature: expand LimitedWorld restrictions (#88)
* feature: allow `all` as releaseStatus query flag on `/avatars` (#85)
* feature: add JS and CSS download endpoints (#80)
* feature: add missing API Config fields (#78)
* fix!: deprecate `/health` (#79)
* fix: number to integer in World and LimitedWorld (#86)
* docs: correct `limit` to `n` in API description
* chore!: replace number with integer where possible (#89)

Project maintenance: (does not affect produced Docs or SDK)
* docs: add README.md (#81)
* ci: autogenerate Node, Python, Java and C# API SDK libraries
* chore: sort yaml data with yq sortKeys (#87)

## 1.3.3

* fix!: `fallbackAvatar` is not present on User (#74)

## 1.3.2

* feature: add checkUserExists via /auth/exists endpoint to search for username/displayName/email (#73)
* docs: add Tags placeholder descriptions

## 1.3.1

* fix: `fallbackAvatar` on `CurrentUser` can be missing
* fix: Added missing bodies to Invite endpoints
* docs: Clarified `getCurrentUser` auth-related documentation

---

## Switched to [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages.

---

## 1.3.0

* Added Invite API endpoits, with `inviteUser`, `requestInvite` and `respondInvite`.
* Added InviteMessage editing, allowing editing of response messages used to reply to invites.

## 1.2.2

* **Minor breaking:** `last_platform` can be more than just `standalonewindows` or `android`, but can pretty much be any random Unity version. So changed from Enum to string.

## 1.2.1

* **Minor breaking:** `location` is not returned by LimitedUser (gotten via `searchUsers`)

## 1.2.0

* **BREAKING:** `FileVersionUploadInfo` renamed to `FileVersionUploadStatus`.
* **BREAKING:** `InlineResponse2003` renamed to `FriendStatus`.
* **BREAKING:** Endpoints which should return Success on success were incorrectly defined to return Error on success. This has been fixed, and will therefore change some languages function declarations.
* Previously deprecated endpoint `searchActiveUsers` has been removed (marked as x-internal).
* Major refactoring on the back-end. This shouldn't be visible to end users due to bundling, but will make maintenance and fixing future merge conflicts *much* easier.

## 1.1.2

* Fix: `pastDisplayNames` should be array of objects, not array of strings.

## 1.1.1

* Fixed breaking-bug where `type` was missing from `addFavorite`, causing the request to fail.

## 1.1.0

* Added Permissions API endpoints
* Logging in no longer requires apiKey, it will set it automatically.
* Logging out will now clear all cookies except apiKey.
* Logging out no longer requires apiKey.
* Started refactoring for easier maintenance in the future
* Fixed minor typos
