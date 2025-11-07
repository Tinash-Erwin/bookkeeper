#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

LOCAL_ENV_FILE="${PROJECT_ROOT}/.env.local"
BACKEND_ENV_FILE="${PROJECT_ROOT}/backend/.env.local"
FRONTEND_ENV_FILE="${PROJECT_ROOT}/frontend/.env.local"

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

if [[ ! -f "${LOCAL_ENV_FILE}" ]]; then
  echo "Missing ${LOCAL_ENV_FILE}. Copy .env.local.example and populate values for local testing." >&2
  exit 1
fi

if [[ ! -f "${BACKEND_ENV_FILE}" ]]; then
  echo "Missing backend/.env.local. Copy backend/.env.local.example and populate it." >&2
  exit 1
fi

if [[ ! -f "${FRONTEND_ENV_FILE}" ]]; then
  echo "Missing frontend/.env.local. Copy frontend/.env.local.example and populate it." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${LOCAL_ENV_FILE}"
set +a

echo "Launching local stack with API at ${VITE_API_BASE_URL:-http://localhost:8080}"

pushd "${PROJECT_ROOT}" >/dev/null

BACKEND_ENV_FILE=${BACKEND_ENV_FILE} FRONTEND_ENV_FILE=${FRONTEND_ENV_FILE} ${compose_command[@]} up --build -d
BACKEND_ENV_FILE=${BACKEND_ENV_FILE} FRONTEND_ENV_FILE=${FRONTEND_ENV_FILE} ${compose_command[@]} ps

popd >/dev/null
