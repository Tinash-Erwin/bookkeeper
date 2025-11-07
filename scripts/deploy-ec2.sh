#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.yml"
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
  echo "Missing ${ENV_FILE}. Copy .env.example and populate the values before deploying." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if [[ -n "${EC2_HOST:-}" ]]; then
  echo "Target EC2 host: ${EC2_HOST}"
fi

if [[ -n "${PUBLIC_DOMAIN:-}" ]]; then
  echo "Domain configured for TLS: ${PUBLIC_DOMAIN}"
fi

pushd "${PROJECT_ROOT}" >/dev/null

${compose_command[@]} --env-file "${ENV_FILE}" pull --ignore-pull-failures
${compose_command[@]} --env-file "${ENV_FILE}" up --build -d
${compose_command[@]} --env-file "${ENV_FILE}" ps

popd >/dev/null
