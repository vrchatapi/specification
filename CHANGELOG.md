# Release Notes

Lines with "!:" are to some degree code-**breaking**. Lines with ":" should not be breaking.

## 1.6.7

* fix: add missing 'queued' as enum for FileStatus

## 1.6.6

* fix: add missing fields to invite API

## 1.6.5

* fix: make `youtubePreviewId` truly nullable

## 1.6.4

* fix: add missing Region type "unknown" (#119) 

## 1.6.3

* fix!: fix World-related specification problem

## 1.6.0

* fix!: update Instance documentation (this made `region` and `photonRegion` into enums)
* feature: add US East region
* docs: flush out User and Avatar documentation

## 1.5.3

* feature: add IPS (Info Push System) endpoint (#116) 
* feature: add avatarImageUrl description (#114)

## 1.5.2

* feature: add Subscription/Transaction/License API (#111)

## 1.5.1

* feature: add Instance API (#106)
* fix!: fix CSS asset path (#110) 
* docs: update /time and /visits documentation, no longer plain (#108)
* docs: fix Invite Message-related documentation (#109) 

## 1.5.0

* **refactor!: remove use of unnamed Inline Requests and Responses (#102)**<br>
  **This means if you use InlineObject or InlineResponse anywhere in your code, these will need to be changed to the respective classes with actual names.**
* feature: add "Select Fallback Avatar" endpoint (#99)
* feature: friends endpoint returns `location` and `friendKey` (#98)
* fix: world capacity can be zero (#105)
* docs: specify enum defaults
* docs: clarify "Respond Invite" docs
* docs: fix incorrect comment on "Respond Invite" request
* docs: fix 403 Error message title having wrong status code
* docs: fixed minor typo in favorites tags documentation

Project maintenance: (does not affect produced Docs or SDK)
* refactor: sort endpoints in natural order for website (#103)
* chore(deps): bump @redocly/openapi-cli (#96)
* ci: auto-deploy to Rust repository<br>
  (This means the Rust repo will from now on automatically update as well)

## 1.4.2

* fix!: instance ownerId is not required (#95)
* fix!: client number can be "unknown" (#94)
* docs: create CODE_OF_CONDUCT.md (#82)

## 1.4.1

* fix!: publicationDate on LimitedWorld can be none (#92) 
* fix!: publicationDate on public world can be none (#91) 
* fix!: mark added-on location fields to User as optional (#90) 

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
