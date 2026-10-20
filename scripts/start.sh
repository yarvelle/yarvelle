#!/usr/bin/env bash
# ==============================================================================
# Yarvelle — Personal & Family AI Assistant Application
# Unified Startup, Process Management & Health Orchestration Script
# ==============================================================================

set -euo pipefail

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Resolve project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Track whether YARVELLE_WEB_PORT was explicitly provided before Loading .env
YARVELLE_WEB_PORT_SET=0
if [ -n "${YARVELLE_WEB_PORT:-}" ]; then
    YARVELLE_WEB_PORT_SET=1
fi

# Safely load .env if present without executing arbitrary shell syntax
if [ -f "${PROJECT_ROOT}/.env" ]; then
    while IFS= read -r line || [ -n "${line}" ]; do
        line="${line#"${line%%[![:space:]]*}"}"
        line="${line%"${line##*[![:space:]]}"}"
        if [ -z "${line}" ] || [[ "${line}" == \#* ]]; then
            continue
        fi
        line="${line#export }"
        if [[ "${line}" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            val="${BASH_REMATCH[2]}"
            if [[ "${val}" =~ ^\"(.*)\"$ ]]; then
                val="${BASH_REMATCH[1]}"
            elif [[ "${val}" =~ ^\'(.*)\'$ ]]; then
                val="${BASH_REMATCH[1]}"
            else
                val="${val%%[[:space:]]#*}"
                val="${val%"${val##*[![:space:]]}"}"
            fi
            if [ -z "${!key:-}" ]; then
                export "${key}=${val}"
            fi
        fi
    done < "${PROJECT_ROOT}/.env"
fi

if [ -n "${YARVELLE_WEB_PORT:-}" ]; then
    YARVELLE_WEB_PORT_SET=1
fi

# Default Configuration
YARVELLE_BACKEND_PORT="${YARVELLE_BACKEND_PORT:-${YARVELLE_PORT:-${PORT:-8000}}}"
YARVELLE_BACKEND_HOST="${YARVELLE_HOST:-${YARVELLE_BACKEND_HOST:-${HOST:-127.0.0.1}}}"
YARVELLE_WEB_PORT="${YARVELLE_WEB_PORT:-3000}"
YARVELLE_WEB_HOST="${YARVELLE_WEB_HOST:-localhost}"

YARVELLE_HOME_DIR="${YARVELLE_HOME:-${HOME:-${PROJECT_ROOT}}/.yarvelle}"
LOG_DIR="${YARVELLE_LOG_DIR:-${YARVELLE_HOME_DIR}/logs}"
PID_FILE="${YARVELLE_PID_FILE:-${YARVELLE_HOME_DIR}/.yarvelle.pids}"

# Tracking child PIDs for cleanup in foreground modes
CHILD_PIDS=()

log_info() {
    echo -e "${CYAN}[yarvelle]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[yarvelle:ok]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[yarvelle:warn]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[yarvelle:error]${NC} $1" >&2
}

resolve_python_bin() {
    local venv_py="${PROJECT_ROOT}/backend/.venv/bin/python3"
    local shared_venv_py="${PROJECT_ROOT}/../carefold/backend/.venv/bin/python3"
    if [ -x "${venv_py}" ]; then
        echo "${venv_py}"
    elif [ -x "${shared_venv_py}" ]; then
        echo "${shared_venv_py}"
    elif command -v python3 >/dev/null 2>&1; then
        echo "$(command -v python3)"
    else
        echo "python3"
    fi
}

check_prerequisites() {
    local target="${1:-all}"
    local missing=()

    if [ "${target}" = "all" ] || [ "${target}" = "web" ]; then
        command -v node >/dev/null 2>&1 || missing+=("node (Node.js runtime >=22)")
        command -v pnpm >/dev/null 2>&1 || missing+=("pnpm (Node.js package manager)")
    fi

    if [ "${target}" = "all" ] || [ "${target}" = "backend" ]; then
        local py_bin
        py_bin="$(resolve_python_bin)"
        if [ ! -x "${py_bin}" ] && ! command -v python3 >/dev/null 2>&1; then
            missing+=("python3 (Python >=3.12 or backend/.venv)")
        fi
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required runtime tools in PATH:"
        for tool in "${missing[@]}"; do
            echo -e "  - ${YELLOW}${tool}${NC}" >&2
        done
        exit 1
    fi
}

ensure_dependencies() {
    if [ ! -d "${PROJECT_ROOT}/frontend/node_modules" ]; then
        log_info "Installing dependencies via pnpm..."
        cd "${PROJECT_ROOT}"
        pnpm install
    fi
}

is_port_in_use() {
    local port="$1"
    lsof -iTCP:"${port}" -sTCP:LISTEN -n -P >/dev/null 2>&1
}

kill_port_process() {
    local port="$1"
    local pids
    pids=$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)
    if [ -n "${pids}" ]; then
        for pid in ${pids}; do
            kill -TERM "${pid}" 2>/dev/null || true
        done
        sleep 0.5
        pids=$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)
        if [ -n "${pids}" ]; then
            for pid in ${pids}; do
                kill -9 "${pid}" 2>/dev/null || true
            done
        fi
    fi
}

cleanup_foreground() {
    if [ ${#CHILD_PIDS[@]} -gt 0 ]; then
        log_info "Shutting down child processes..."
        for pid in "${CHILD_PIDS[@]}"; do
            if kill -0 "${pid}" 2>/dev/null; then
                kill -TERM "${pid}" 2>/dev/null || true
            fi
        done
        wait 2>/dev/null || true
        kill_port_process "${YARVELLE_BACKEND_PORT}"
        kill_port_process "${YARVELLE_WEB_PORT}"
        rm -f "${PID_FILE}" 2>/dev/null || true
        log_success "All child processes stopped."
    fi
}

start_backend() {
    local bg_mode="$1"
    local log_out="${2:-/dev/stdout}"
    local log_err="${3:-/dev/stderr}"

    if is_port_in_use "${YARVELLE_BACKEND_PORT}"; then
        log_warn "Backend port ${YARVELLE_BACKEND_PORT} is already in use. Skipping start."
        return 0
    fi

    check_prerequisites "backend"

    log_info "Starting Backend API on http://${YARVELLE_BACKEND_HOST}:${YARVELLE_BACKEND_PORT}..."
    cd "${PROJECT_ROOT}/backend"

    local py_bin
    py_bin="$(resolve_python_bin)"
    local py_path="${PROJECT_ROOT}/backend/src:${PROJECT_ROOT}/../yarvelle-core/backend/src:${PROJECT_ROOT}/../carefold/backend/src:${PYTHONPATH:-}"

    if [ "${bg_mode}" = "true" ]; then
        nohup env PYTHONPATH="${py_path}" \
            YARVELLE_HOST="${YARVELLE_BACKEND_HOST}" \
            YARVELLE_PORT="${YARVELLE_BACKEND_PORT}" \
            PORT="${YARVELLE_BACKEND_PORT}" \
            "${py_bin}" -m uvicorn yarvelle.main:app \
            --host "${YARVELLE_BACKEND_HOST}" \
            --port "${YARVELLE_BACKEND_PORT}" \
            >"${log_out}" 2>"${log_err}" &
        local pid=$!
        CHILD_PIDS+=("${pid}")
        echo "backend:${pid}" >> "${PID_FILE}"
        log_success "Backend running (PID: ${pid})"
    else
        exec env PYTHONPATH="${py_path}" \
            YARVELLE_HOST="${YARVELLE_BACKEND_HOST}" \
            YARVELLE_PORT="${YARVELLE_BACKEND_PORT}" \
            PORT="${YARVELLE_BACKEND_PORT}" \
            "${py_bin}" -m uvicorn yarvelle.main:app \
            --host "${YARVELLE_BACKEND_HOST}" \
            --port "${YARVELLE_BACKEND_PORT}"
    fi
}

start_web() {
    local bg_mode="$1"
    local log_out="${2:-/dev/stdout}"
    local log_err="${3:-/dev/stderr}"

    if is_port_in_use "${YARVELLE_WEB_PORT}"; then
        log_warn "Web port ${YARVELLE_WEB_PORT} is already in use. Skipping start."
        return 0
    fi

    check_prerequisites "web"
    ensure_dependencies

    log_info "Starting Next.js Web UI on http://${YARVELLE_WEB_HOST}:${YARVELLE_WEB_PORT}..."
    cd "${PROJECT_ROOT}/frontend"

    local next_bin="${PROJECT_ROOT}/frontend/node_modules/.bin/next"
    if [ ! -x "${next_bin}" ] && [ -x "${PROJECT_ROOT}/node_modules/.bin/next" ]; then
        next_bin="${PROJECT_ROOT}/node_modules/.bin/next"
    fi
    local backend_url="http://${YARVELLE_BACKEND_HOST}:${YARVELLE_BACKEND_PORT}"

    if [ "${bg_mode}" = "true" ]; then
        if [ -x "${next_bin}" ]; then
            perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV' env NEXT_TELEMETRY_DISABLED=1 \
                BACKEND_URL="${backend_url}" \
                PORT="${YARVELLE_WEB_PORT}" \
                "${next_bin}" dev --port "${YARVELLE_WEB_PORT}" </dev/null >"${log_out}" 2>"${log_err}" &
        else
            perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV' env NEXT_TELEMETRY_DISABLED=1 \
                BACKEND_URL="${backend_url}" \
                PORT="${YARVELLE_WEB_PORT}" \
                pnpm dev --port "${YARVELLE_WEB_PORT}" </dev/null >"${log_out}" 2>"${log_err}" &
        fi
        local pid=$!
        CHILD_PIDS+=("${pid}")
        echo "web:${pid}" >> "${PID_FILE}"
        log_success "Web UI running (PID: ${pid})"
    else
        if [ -x "${next_bin}" ]; then
            exec env NEXT_TELEMETRY_DISABLED=1 \
                BACKEND_URL="${backend_url}" \
                PORT="${YARVELLE_WEB_PORT}" \
                "${next_bin}" dev --port "${YARVELLE_WEB_PORT}"
        else
            exec env NEXT_TELEMETRY_DISABLED=1 \
                BACKEND_URL="${backend_url}" \
                PORT="${YARVELLE_WEB_PORT}" \
                pnpm dev --port "${YARVELLE_WEB_PORT}"
        fi
    fi
}

wait_for_health() {
    local port="$1"
    local name="$2"
    local max_wait=30
    local elapsed=0

    log_info "Waiting for ${name} on port ${port} to be ready..."
    while ! is_port_in_use "${port}" && [ "${elapsed}" -lt "${max_wait}" ]; do
        sleep 0.5
        elapsed=$((elapsed + 1))
    done

    if is_port_in_use "${port}"; then
        log_success "${name} is healthy on port ${port}."
        return 0
    else
        log_warn "${name} did not become ready within ${max_wait}s on port ${port}."
        return 1
    fi
}

show_dashboard() {
    echo ""
    echo -e "${BOLD}${CYAN}==============================================================================${NC}"
    echo -e "${BOLD}${CYAN}                     Yarvelle AI Platform Active                              ${NC}"
    echo -e "${BOLD}${CYAN}==============================================================================${NC}"
    echo -e "  ${BOLD}Next.js Web UI:${NC}            ${GREEN}http://${YARVELLE_WEB_HOST}:${YARVELLE_WEB_PORT}${NC}"
    echo -e "  ${BOLD}FastAPI Backend API:${NC}       ${GREEN}http://${YARVELLE_BACKEND_HOST}:${YARVELLE_BACKEND_PORT}${NC}"
    echo -e "    ├─ Health Check:          ${BLUE}http://${YARVELLE_BACKEND_HOST}:${YARVELLE_BACKEND_PORT}/healthz${NC}"
    echo -e "    ├─ Interactive API Docs:  ${BLUE}http://${YARVELLE_BACKEND_HOST}:${YARVELLE_BACKEND_PORT}/docs${NC}"
    echo -e "    └─ OpenAPI Specification: ${BLUE}http://${YARVELLE_BACKEND_HOST}:${YARVELLE_BACKEND_PORT}/openapi.json${NC}"
    echo -e "${BOLD}${CYAN}==============================================================================${NC}"
    echo ""
}

cmd_all() {
    mkdir -p "${LOG_DIR}"
    : > "${PID_FILE}"
    trap cleanup_foreground INT TERM EXIT

    log_info "Starting full Yarvelle stack (Backend API + Web UI)..."
    start_backend "true" "${LOG_DIR}/backend.log" "${LOG_DIR}/backend.err.log"
    start_web "true" "${LOG_DIR}/web.log" "${LOG_DIR}/web.err.log"

    wait_for_health "${YARVELLE_BACKEND_PORT}" "Backend API" || true
    wait_for_health "${YARVELLE_WEB_PORT}" "Web UI" || true

    show_dashboard

    echo -e "${YELLOW}Logs are streaming to:${NC} ${LOG_DIR}/"
    echo -e "  - Backend API: ${LOG_DIR}/backend.log"
    echo -e "  - Web UI:      ${LOG_DIR}/web.log"
    echo ""
    echo -e "${BOLD}Press Ctrl+C to stop all components.${NC}"

    wait
}

cmd_start_daemon() {
    mkdir -p "${LOG_DIR}"
    : > "${PID_FILE}"

    log_info "Starting Yarvelle stack in background daemon mode..."
    start_backend "true" "${LOG_DIR}/backend.log" "${LOG_DIR}/backend.err.log"
    start_web "true" "${LOG_DIR}/web.log" "${LOG_DIR}/web.err.log"

    wait_for_health "${YARVELLE_BACKEND_PORT}" "Backend API" || true
    wait_for_health "${YARVELLE_WEB_PORT}" "Web UI" || true

    show_dashboard

    log_success "All components started in background. PIDs saved to ${PID_FILE}."
    echo -e "Use ${BOLD}./scripts/start.sh stop${NC} to terminate all background services."
    echo -e "Use ${BOLD}./scripts/start.sh status${NC} to inspect health."
}

cmd_stop() {
    log_info "Stopping Yarvelle components..."
    if [ -f "${PID_FILE}" ]; then
        while IFS=: read -r comp pid; do
            if [ -n "${pid}" ] && kill -0 "${pid}" 2>/dev/null; then
                log_info "Stopping ${comp} (PID: ${pid})..."
                kill -TERM "${pid}" 2>/dev/null || true
            fi
        done < "${PID_FILE}"
        rm -f "${PID_FILE}"
    fi

    kill_port_process "${YARVELLE_BACKEND_PORT}"
    kill_port_process "${YARVELLE_WEB_PORT}"

    log_success "All Yarvelle components stopped."
}

cmd_status() {
    echo -e "${BOLD}=== Yarvelle Service Status ===${NC}"

    printf "%-16s %-10s %-12s %-28s\n" "Component" "Port" "Status" "URL"
    printf "%-16s %-10s %-12s %-28s\n" "----------------" "----------" "------------" "----------------------------"

    local backend_status="STOPPED"
    if is_port_in_use "${YARVELLE_BACKEND_PORT}"; then backend_status="${GREEN}RUNNING${NC}"; else backend_status="${RED}STOPPED${NC}"; fi
    printf "%-16s %-10s %-22b %-28s\n" "Backend API" "${YARVELLE_BACKEND_PORT}" "${backend_status}" "http://${YARVELLE_BACKEND_HOST}:${YARVELLE_BACKEND_PORT}"

    local web_status="STOPPED"
    if is_port_in_use "${YARVELLE_WEB_PORT}"; then web_status="${GREEN}RUNNING${NC}"; else web_status="${RED}STOPPED${NC}"; fi
    printf "%-16s %-10s %-22b %-28s\n" "Web UI" "${YARVELLE_WEB_PORT}" "${web_status}" "http://${YARVELLE_WEB_HOST}:${YARVELLE_WEB_PORT}"

    echo ""
}

cmd_help() {
    echo -e "${BOLD}Usage:${NC} ./scripts/start.sh [COMMAND] [OPTIONS]"
    echo ""
    echo -e "${BOLD}Commands:${NC}"
    echo -e "  ${GREEN}all${NC}                 Start Backend API and Web UI in foreground (default)"
    echo -e "  ${GREEN}start, daemon${NC}       Start all components in background daemon mode (writes .yarvelle.pids)"
    echo -e "  ${GREEN}stop${NC}                Stop all running components and clear ports"
    echo -e "  ${GREEN}status${NC}              Check status and active URLs of all components"
    echo -e "  ${GREEN}backend${NC}             Start only the FastAPI Backend in foreground (on :${YARVELLE_BACKEND_PORT})"
    echo -e "  ${GREEN}web${NC}                 Start only the Next.js Web UI in foreground (on :${YARVELLE_WEB_PORT})"
    echo -e "  ${GREEN}help, --help, -h${NC}    Show this help message"
    echo ""
    echo -e "${BOLD}Environment Variables:${NC}"
    echo -e "  YARVELLE_BACKEND_PORT     Port for FastAPI Backend API (default: 8000)"
    echo -e "  YARVELLE_BACKEND_HOST     Host for FastAPI Backend API (default: 127.0.0.1)"
    echo -e "  YARVELLE_WEB_PORT         Port for Next.js Web UI (default: 3000)"
    echo -e "  YARVELLE_WEB_HOST         Host for Next.js Web UI (default: localhost)"
    echo -e "  PORT                      Generic fallback port override for backend or standalone commands"
    echo ""
}

main() {
    local cmd="${1:-all}"

    case "${cmd}" in
        help|--help|-h)
            cmd_help
            return 0
            ;;
        status)
            cmd_status
            return 0
            ;;
        stop)
            cmd_stop
            return 0
            ;;
    esac

    case "${cmd}" in
        all)
            check_prerequisites "all"
            ensure_dependencies
            cmd_all
            ;;
        start|daemon)
            check_prerequisites "all"
            ensure_dependencies
            cmd_start_daemon
            ;;
        backend)
            start_backend "false"
            ;;
        web)
            if [ -n "${PORT:-}" ] && [ "${YARVELLE_WEB_PORT_SET}" -eq 0 ]; then
                YARVELLE_WEB_PORT="${PORT}"
            fi
            start_web "false"
            ;;
        *)
            log_error "Unknown command: ${cmd}"
            cmd_help
            exit 1
            ;;
    esac
}

main "$@"
