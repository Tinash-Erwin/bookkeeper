#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

ENV_FILE="${PROJECT_ROOT}/.env"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required but was not found on PATH" >&2
  exit 1
fi

compose_command=(docker compose)
if ! ${compose_command[@]} version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    compose_command=(docker-compose)
  else
    echo "docker compose plugin (v2) or docker-compose (v1) is required" >&2
    exit 1
  fi
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy .env.example and populate values before running." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

echo "Launching local stack with API at ${VITE_API_BASE_URL:-http://localhost:8080}"

pushd "${PROJECT_ROOT}" >/dev/null

${compose_command[@]} --env-file "${ENV_FILE}" up --build -d
${compose_command[@]} --env-file "${ENV_FILE}" ps

popd >/dev/null
