#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

vendor() {
	repository=$1
	commit=$2
	source=$3
	destination=$4

	checkout=$(mktemp -d)
	git clone --quiet --filter=blob:none --no-checkout "https://github.com/$repository.git" "$checkout"
	git -C "$checkout" fetch --quiet origin "$commit"

	mkdir -p "$destination"
	git -C "$checkout" ls-tree --name-only "$commit" -- "$source/" | while read -r file; do
		case "$file" in
			*.yaml) git -C "$checkout" show "$commit:$file" > "$destination/$(basename "$file")" ;;
		esac
	done
	git -C "$checkout" show "$commit:LICENSE" > "$(dirname "$destination")/LICENSE"

	rm -rf "$checkout"
}

rm -rf fixtures/oai fixtures/learn

vendor OAI/OpenAPI-Specification 4c4ae377d28cc9f0eb3ed598fcf3c89512ff8fa3 _archive_/schemas/v3.0/pass fixtures/oai/3.0
vendor OAI/OpenAPI-Specification 6c6c327036987ad18352478b5eba54be10e4865f tests/schema/pass fixtures/oai/3.1
vendor OAI/OpenAPI-Specification bb95c80a93c42749ed79b11a4bb4a5f4cf8eafc0 tests/schema/pass fixtures/oai/3.2
vendor OAI/learn.openapis.org bbb743ed3b7c5ed76b6e6ba9b302af38f3956c44 examples/v3.1 fixtures/learn/3.1
vendor OAI/learn.openapis.org bbb743ed3b7c5ed76b6e6ba9b302af38f3956c44 examples/v3.2 fixtures/learn/3.2
