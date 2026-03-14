#!/usr/bin/env bash
# DocuVoice — Build & Deploy (run from project root)
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[  OK]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

COMPOSE_FILE="docker-compose.prod.yml"

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║  DocuVoice — Production Deploy            ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Pre-flight checks ────────────────────────────────────────────────────────
[ -f "$COMPOSE_FILE" ] || fail "Run from project root (missing $COMPOSE_FILE)"
[ -f "backend/.env" ]  || fail "Missing backend/.env — copy from .env.example and fill in secrets"

# ── Validate env files have real values ──────────────────────────────────────
if grep -q "^AWS_ACCESS_KEY_ID=$" backend/.env 2>/dev/null; then
    fail "backend/.env has empty AWS_ACCESS_KEY_ID — fill in your credentials"
fi

# ── Build ────────────────────────────────────────────────────────────────────
info "Building all images (this may take a few minutes on first run)..."
docker compose -f "$COMPOSE_FILE" build --parallel

ok "Images built"

# ── Deploy ───────────────────────────────────────────────────────────────────
info "Stopping existing containers (if any)..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

info "Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

# ── Wait for health ──────────────────────────────────────────────────────────
info "Waiting for backend to become healthy..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until docker compose -f "$COMPOSE_FILE" ps backend | grep -q "healthy"; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
        fail "Backend did not become healthy after ${MAX_ATTEMPTS} attempts"
    fi
    sleep 2
done
ok "Backend is healthy"

# ── Status ───────────────────────────────────────────────────────────────────
echo ""
docker compose -f "$COMPOSE_FILE" ps
echo ""

echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  Deployed! Site will be live at:                             ║${NC}"
echo -e "${GREEN}${BOLD}║  https://novasonic-hackathon.sumanpaudel.me                  ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Caddy auto-provisions SSL on first request (may take ~30s).${NC}"
echo ""
echo -e "Useful commands:"
echo -e "  ${BOLD}docker compose -f $COMPOSE_FILE logs -f${NC}          # Tail all logs"
echo -e "  ${BOLD}docker compose -f $COMPOSE_FILE logs -f caddy${NC}    # Caddy/SSL logs"
echo -e "  ${BOLD}docker compose -f $COMPOSE_FILE logs -f backend${NC}  # Backend logs"
echo -e "  ${BOLD}docker compose -f $COMPOSE_FILE restart backend${NC}  # Restart backend"
echo -e "  ${BOLD}docker compose -f $COMPOSE_FILE down${NC}             # Stop everything"
echo -e "  ${BOLD}./deploy/deploy.sh${NC}                               # Re-deploy (pull + build + up)"
echo ""
