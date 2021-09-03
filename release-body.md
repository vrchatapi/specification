# Release Notes

## UNRELEASED 1.2.0

* **BREAKING:** `FileVersionUploadInfo` renamed to `FileVersionUploadStatus`.
* Major refactoring on the back-end. This shouldn't be visible to end users, but will make maintenance and fixing merge conflicts *much* easier.

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
