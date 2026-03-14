#!/usr/bin/env bash
# DocuVoice — Pull from ECR & Run on EC2
# Run from project root: ./deploy/pull-and-run.sh
set -euo pipefail

ACCOUNT_ID="136673894316"
REGION="us-east-1"
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
COMPOSE_FILE="deploy/docker-compose.ecr.yml"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[  OK]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║  DocuVoice — Pull & Run from ECR          ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Pre-flight ───────────────────────────────────────────────────────────────
[ -f "$COMPOSE_FILE" ] || fail "Run from project root (missing $COMPOSE_FILE)"
[ -f "backend/.env" ]  || fail "Missing backend/.env"

# ── Create CloudWatch log groups (if they don't exist) ───────────────────────
info "Ensuring CloudWatch log groups exist..."
for group in /ecs/docuvoice-backend /ecs/docuvoice-frontend /ecs/docuvoice-agent; do
    aws logs create-log-group --log-group-name "$group" --region "$REGION" 2>/dev/null || true
done
ok "Log groups ready"

# ── Login to ECR ─────────────────────────────────────────────────────────────
info "Logging into ECR..."
aws ecr get-login-password --region "$REGION" | \
    docker login --username AWS --password-stdin "$ECR_REGISTRY"
ok "ECR login"

# ── Pull latest images ───────────────────────────────────────────────────────
info "Pulling latest images..."
docker compose -f "$COMPOSE_FILE" pull
ok "Images pulled"

# ── Stop old containers ──────────────────────────────────────────────────────
info "Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

# ── Start ────────────────────────────────────────────────────────────────────
info "Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

# ── Wait for health ──────────────────────────────────────────────────────────
info "Waiting for backend to become healthy..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until docker compose -f "$COMPOSE_FILE" ps backend 2>/dev/null | grep -q "healthy"; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
        fail "Backend didn't become healthy. Check: docker compose -f $COMPOSE_FILE logs backend"
    fi
    sleep 2
done
ok "Backend is healthy"

echo ""
docker compose -f "$COMPOSE_FILE" ps
echo ""

echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  Live at: https://novasonic-hackathon.sumanpaudel.me         ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
