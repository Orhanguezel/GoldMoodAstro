#!/usr/bin/env bash
# Load local release env without printing secret values.
#
# Priority:
#   1. .secrets/credentials.env
#   2. backend/.env only for variables that are still empty

load_env_file_if_present() {
  local file="$1"
  local mode="${2:-override}"

  [[ -f "$file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" == *"="* ]] || continue

    local key="${line%%=*}"
    local value="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue

    if [[ "$mode" == "fill" && -n "${!key:-}" ]]; then
      continue
    fi

    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi

    export "$key=$value"
  done < "$file"
}

load_local_env() {
  local root="$1"
  load_env_file_if_present "$root/.secrets/credentials.env" override
  load_env_file_if_present "$root/backend/.env" fill
}
