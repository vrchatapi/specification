#!/bin/sh
# Drives the suite against the live API. Captures land in .out/har/, which
# `coverage` and `drift` read as a folder.
#
# `schema check` stays a warning: it is the standing backlog of fields the
# description gets wrong, and erroring on it would leave the suite always red.
set -eu

cd "$(dirname "$0")/.."

# Braces in the value break `${VAR:=default}`.
if [ -z "${TEST_SEVERITY:-}" ]; then
	TEST_SEVERITY='{"SCHEMA_CHECK":"warn"}'
fi

if [ -f test/.env ]; then
	set -a
	. ./test/.env
	set +a
fi

# An empty input is worse than a missing one: respect sends the literal
# `{userId}` in the path.
: "${VRCHAT_FRIEND_ID:?unset — see test/.env.example}"
: "${VRCHAT_EMAIL:?unset — see test/.env.example}"

mkdir -p test/.out/har

# Fixed port, because `sourceDescriptions` takes no expressions. The hostname
# has to match it too: httpexec defaults to `localhost`, which resolves to ::1
# first on the CI runners, leaving nothing on the 127.0.0.1 the description names.
httpexec --port 65482 --hostname 127.0.0.1 &
httpexec_pid=$!

# Only EXIT kills the server, so it happens once. INT and TERM exit, which
# fires EXIT; killing there would leave the script running against a dead one.
trap 'kill "$httpexec_pid" 2>/dev/null' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Bind is not instant, and respect fetches the description before step one.
curl -sf --retry 20 --retry-delay 1 --retry-connrefused -o /dev/null \
	http://127.0.0.1:65482/openapi.json

# respect rejects `--skip` alongside `--workflow`, so naming a workflow drops
# the skips. Only what you name runs: `pnpm test -w session -w get-current-user`.
# A partial run writes its capture elsewhere, so it cannot overwrite the one
# `coverage` and `drift` read as a whole-suite record.
skips='--skip logout --skip invite-message-lifecycle --skip group-lifecycle --skip group-calendar-lifecycle'
capture=test/.out/har/arazzo.har
for argument do
	case $argument in
		-w | --workflow) skips=''; capture=test/.out/partial.har ;;
	esac
done

# `login` caches a session under .out/ and `session` reads it back. Skipping it
# while the cache is warm keeps repeated runs off the login rate limit. Delete
# test/.out/session to force a fresh login.
if [ ! -s test/.out/session ]; then
	: "${VRCHAT_PASSWORD:?unset — see test/.env.example}"
	: "${VRCHAT_TOTP_SECRET:?unset — see test/.env.example}"

	set -- \
		--input password="$VRCHAT_PASSWORD" \
		--input totpSecret="$VRCHAT_TOTP_SECRET" \
		"$@"
elif [ -n "$skips" ]; then
	set -- --skip login "$@"
fi

# `logout` kills the session, `invite-message-lifecycle` locks a slot for half
# an hour, and the two group lifecycles create a group, which is rate limited
# for hours. Run those deliberately: `pnpm test -w group-lifecycle`.
redocly respect test/arazzo.yaml \
	${skips} \
	--har-output "$capture" \
	--input friendId="$VRCHAT_FRIEND_ID" \
	--input username="${VRCHAT_USERNAME:-$VRCHAT_EMAIL}" \
	--input email="$VRCHAT_EMAIL" \
	--severity "$TEST_SEVERITY" \
	"$@"
