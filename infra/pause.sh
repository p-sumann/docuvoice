#!/usr/bin/env bash
# DocuVoice — Pause
# Locks S3 (denies writes so no new storage accumulates).
# DynamoDB on-demand is already $0 when idle — nothing to pause there.
# Bedrock costs only when the agent is actively running — kill those processes.
set -euo pipefail

REGION="us-east-1"
DYNAMO_TABLE="docuvoice-main"
S3_BUCKET=""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[  OK]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
step()  { echo -e "\n${CYAN}${BOLD}==> $*${NC}"; }

echo ""
echo -e "${YELLOW}${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${YELLOW}${BOLD}║     DocuVoice — Pause                ║${NC}"
echo -e "${YELLOW}${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

step "Checking AWS credentials"
CALLER_IDENTITY=$(aws sts get-caller-identity --region "$REGION" 2>&1) || {
    echo -e "${RED}[FAIL]${NC}  AWS credentials invalid or expired."
    exit 1
}
ACCOUNT=$(echo "$CALLER_IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Account'])")
S3_BUCKET="docuvoice-uploads-${ACCOUNT}"
ok "Account: $ACCOUNT"

# ── Lock S3 writes ────────────────────────────────────────────────────────────
step "Locking S3 bucket (deny all writes)"

DENY_POLICY="{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
        \"Sid\": \"DocuVoicePaused\",
        \"Effect\": \"Deny\",
        \"Principal\": \"*\",
        \"Action\": [\"s3:PutObject\", \"s3:DeleteObject\"],
        \"Resource\": \"arn:aws:s3:::${S3_BUCKET}/*\"
    }]
}"

aws s3api put-bucket-policy \
    --bucket "$S3_BUCKET" \
    --policy "$DENY_POLICY" \
    --region "$REGION" \
&& ok "S3 locked — PutObject / DeleteObject denied (existing data safe)" \
|| warn "Could not lock S3 bucket (may not exist yet)"

# ── DynamoDB: already $0 ──────────────────────────────────────────────────────
step "DynamoDB: $DYNAMO_TABLE"
info "Nothing to pause — on-demand billing = \$0 when no reads/writes happen."
info "Just stop your backend and agent processes."

# ── Bedrock: process-level ────────────────────────────────────────────────────
step "Bedrock / Nova Sonic 2"
info "Nova Sonic costs per token only while the agent is running."
info "Kill your agent process to stop all Bedrock spend."

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}${BOLD}║  DocuVoice is PAUSED                                 ║${NC}"
echo -e "${YELLOW}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  S3       ${YELLOW}LOCKED${NC}    no new uploads accepted"
echo -e "  DynamoDB ${GREEN}IDLE${NC}      \$0/hr (on-demand, no activity)"
echo -e "  Bedrock  ${GREEN}IDLE${NC}      \$0/hr (costs only when agent runs)"
echo ""
echo -e "${YELLOW}Action required:${NC}"
echo -e "  Stop your backend:  ${BOLD}kill \$(lsof -ti:8000)${NC}  or Ctrl+C"
echo -e "  Stop your agent:    ${BOLD}kill \$(lsof -ti:8001)${NC}  or Ctrl+C"
echo ""
echo -e "  To resume:  ${BOLD}./infra/resume.sh${NC}"
echo -e "  To delete:  ${BOLD}./infra/cleanup.sh${NC}"
echo ""
