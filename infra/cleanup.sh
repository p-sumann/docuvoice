#!/usr/bin/env bash
# DocuVoice AWS Infrastructure Cleanup
# Permanently deletes all DocuVoice AWS resources.
# Requires typing 'delete' to confirm — this is irreversible.
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
REGION="us-east-1"
DYNAMO_TABLE="docuvoice-main"
S3_BUCKET=""  # resolved after credential check below

# ── Colors ───────────────────────────────────────────────────────────────────
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
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; }
step()  { echo -e "\n${CYAN}${BOLD}==> $*${NC}"; }

# ── Warning banner ────────────────────────────────────────────────────────────
echo ""
echo -e "${RED}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}${BOLD}║  DocuVoice — AWS Resource Cleanup (DESTRUCTIVE)      ║${NC}"
echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "This will ${RED}${BOLD}PERMANENTLY DELETE${NC} the following:"
echo ""
echo -e "  ${CYAN}S3:${NC}        s3://docuvoice-uploads-<account-id>  ${RED}(all uploaded documents gone)${NC}"
echo -e "  ${CYAN}DynamoDB:${NC}  $DYNAMO_TABLE  ${RED}(all workspaces, sessions, findings gone)${NC}"
echo ""
echo -e "  Bedrock is pay-per-call — nothing to delete there."
echo ""

# ── Confirmation ──────────────────────────────────────────────────────────────
read -r -p "Type 'delete' to confirm, anything else to cancel: " CONFIRM
if [ "$CONFIRM" != "delete" ]; then
    echo ""
    info "Cleanup cancelled. Resources untouched."
    exit 0
fi
echo ""

# ── Credentials check ─────────────────────────────────────────────────────────
step "Checking AWS credentials"
CALLER_IDENTITY=$(aws sts get-caller-identity --region "$REGION" 2>&1) || {
    fail "AWS credentials invalid or expired."
    exit 1
}
ACCOUNT=$(echo "$CALLER_IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Account'])")
S3_BUCKET="docuvoice-uploads-${ACCOUNT}"
ok "Credentials valid (account: $ACCOUNT)"
info "S3 bucket: $S3_BUCKET"

# ── 1. S3 Bucket ──────────────────────────────────────────────────────────────
step "Deleting S3 bucket: $S3_BUCKET"

if aws s3api head-bucket --bucket "$S3_BUCKET" --region "$REGION" 2>/dev/null; then
    info "Emptying bucket (deleting all objects)..."
    aws s3 rm "s3://$S3_BUCKET" --recursive --region "$REGION" 2>/dev/null \
    && info "All objects deleted" \
    || warn "Could not empty bucket (may already be empty)"

    aws s3api delete-bucket \
        --bucket "$S3_BUCKET" \
        --region "$REGION" \
    && ok "Bucket '$S3_BUCKET' deleted" \
    || { fail "Failed to delete bucket"; exit 1; }
else
    warn "Bucket '$S3_BUCKET' does not exist (already deleted?)"
fi

# ── 2. DynamoDB Table ─────────────────────────────────────────────────────────
step "Deleting DynamoDB table: $DYNAMO_TABLE"

if aws dynamodb describe-table --table-name "$DYNAMO_TABLE" --region "$REGION" &>/dev/null; then
    aws dynamodb delete-table \
        --table-name "$DYNAMO_TABLE" \
        --region "$REGION" \
    && info "Deletion initiated, waiting..." \
    || { fail "Failed to delete table"; exit 1; }

    aws dynamodb wait table-not-exists \
        --table-name "$DYNAMO_TABLE" \
        --region "$REGION" 2>/dev/null \
    && ok "Table '$DYNAMO_TABLE' fully deleted" \
    || warn "Deletion may still be in progress (non-critical)"
else
    warn "Table '$DYNAMO_TABLE' does not exist (already deleted?)"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  Cleanup complete.                   ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  To recreate everything: ${BOLD}./infra/setup.sh${NC}"
echo ""
