#!/usr/bin/env bash
# DocuVoice — Build & Push Docker images to ECR
# Run from project root: ./deploy/build-and-push.sh
set -euo pipefail

ACCOUNT_ID="136673894316"
REGION="us-east-1"
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
TAG="${1:-latest}"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[  OK]${NC}  $*"; }

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║  DocuVoice — Build & Push to ECR          ║${NC}"
echo -e "${CYAN}${BOLD}║  Tag: ${TAG}                                    ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Login to ECR ─────────────────────────────────────────────────────────────
info "Logging into ECR..."
aws ecr get-login-password --region "$REGION" | \
    docker login --username AWS --password-stdin "$ECR_REGISTRY"
ok "ECR login successful"

# ── Build & Push Backend ─────────────────────────────────────────────────────
info "Building backend..."
docker build -t docuvoice-backend:"$TAG" ./backend
docker tag docuvoice-backend:"$TAG" "$ECR_REGISTRY/docuvoice-backend:$TAG"
info "Pushing backend..."
docker push "$ECR_REGISTRY/docuvoice-backend:$TAG"
ok "Backend pushed"

# ── Build & Push Frontend ────────────────────────────────────────────────────
info "Building frontend..."
docker build \
    --build-arg NEXT_PUBLIC_API_URL=https://novasonic-hackathon.sumanpaudel.me \
    --build-arg NEXT_PUBLIC_WS_URL=wss://novasonic-hackathon.sumanpaudel.me \
    -t docuvoice-frontend:"$TAG" ./frontend
docker tag docuvoice-frontend:"$TAG" "$ECR_REGISTRY/docuvoice-frontend:$TAG"
info "Pushing frontend..."
docker push "$ECR_REGISTRY/docuvoice-frontend:$TAG"
ok "Frontend pushed"

# ── Build & Push Agent ───────────────────────────────────────────────────────
info "Building agent..."
docker build -t docuvoice-agent:"$TAG" ./agents
docker tag docuvoice-agent:"$TAG" "$ECR_REGISTRY/docuvoice-agent:$TAG"
info "Pushing agent..."
docker push "$ECR_REGISTRY/docuvoice-agent:$TAG"
ok "Agent pushed"

echo ""
echo -e "${GREEN}${BOLD}All images pushed to ECR:${NC}"
echo -e "  ${ECR_REGISTRY}/docuvoice-backend:${TAG}"
echo -e "  ${ECR_REGISTRY}/docuvoice-frontend:${TAG}"
echo -e "  ${ECR_REGISTRY}/docuvoice-agent:${TAG}"
echo ""
echo -e "On your EC2, run:"
echo -e "  ${BOLD}./deploy/pull-and-run.sh${NC}"
echo ""
