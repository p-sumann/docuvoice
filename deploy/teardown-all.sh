#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# DocuVoice — Teardown ALL AWS Infrastructure
# Removes: EC2, Security Group, IAM Role/Profile, ECR Repos, CloudWatch Logs
# Usage: ./deploy/teardown-all.sh
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

REGION="us-east-1"
PROJECT="docuvoice"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[  OK]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }

echo ""
echo -e "${RED}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}${BOLD}║  DocuVoice — TEARDOWN ALL INFRASTRUCTURE                 ║${NC}"
echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
read -p "Are you sure? This deletes EVERYTHING. Type 'yes' to confirm: " CONFIRM
[ "$CONFIRM" = "yes" ] || { echo "Aborted."; exit 0; }

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ── 1. Terminate EC2 ────────────────────────────────────────────────────────
info "Terminating EC2 instances..."
INSTANCE_IDS=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=${PROJECT}-prod" "Name=instance-state-name,Values=running,stopped,stopping" \
    --query 'Reservations[*].Instances[*].InstanceId' --output text --region "$REGION" 2>/dev/null)

if [ -n "$INSTANCE_IDS" ] && [ "$INSTANCE_IDS" != "None" ]; then
    aws ec2 terminate-instances --instance-ids $INSTANCE_IDS --region "$REGION" &>/dev/null
    info "Waiting for termination..."
    aws ec2 wait instance-terminated --instance-ids $INSTANCE_IDS --region "$REGION"
    ok "EC2 terminated: $INSTANCE_IDS"
else
    ok "No running instances found"
fi

# ── 2. Delete Key Pair ──────────────────────────────────────────────────────
info "Deleting key pair..."
aws ec2 delete-key-pair --key-name "${PROJECT}-key" --region "$REGION" &>/dev/null || true
rm -f "$(dirname "$0")/${PROJECT}-key.pem"
ok "Key pair deleted"

# ── 3. Delete Security Group ────────────────────────────────────────────────
info "Deleting security group..."
SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT}-ec2-sg" \
    --query 'SecurityGroups[0].GroupId' --output text --region "$REGION" 2>/dev/null)
if [ "$SG_ID" != "None" ] && [ -n "$SG_ID" ]; then
    sleep 5  # Wait for ENIs to detach
    aws ec2 delete-security-group --group-id "$SG_ID" --region "$REGION" &>/dev/null || \
        warn "Could not delete SG $SG_ID (may still have dependencies)"
    ok "Security group deleted: $SG_ID"
fi

# ── 4. Delete IAM Role + Instance Profile ────────────────────────────────────
info "Cleaning up IAM..."
ROLE_NAME="${PROJECT}-ec2-role"
PROFILE_NAME="${PROJECT}-ec2-profile"

# Detach policies
for arn in $(aws iam list-attached-role-policies --role-name "$ROLE_NAME" \
    --query 'AttachedPolicies[*].PolicyArn' --output text 2>/dev/null); do
    aws iam detach-role-policy --role-name "$ROLE_NAME" --policy-arn "$arn"
done

# Remove role from profile, delete profile, delete role
aws iam remove-role-from-instance-profile \
    --instance-profile-name "$PROFILE_NAME" --role-name "$ROLE_NAME" &>/dev/null || true
aws iam delete-instance-profile --instance-profile-name "$PROFILE_NAME" &>/dev/null || true
aws iam delete-role --role-name "$ROLE_NAME" &>/dev/null || true
ok "IAM role + profile deleted"

# ── 5. Delete ECR Repos (with images) ───────────────────────────────────────
info "Deleting ECR repos..."
for repo in ${PROJECT}-backend ${PROJECT}-frontend ${PROJECT}-agent; do
    aws ecr delete-repository --repository-name "$repo" --force --region "$REGION" &>/dev/null || true
done
ok "ECR repos deleted"

# ── 6. Delete CloudWatch Log Groups ─────────────────────────────────────────
info "Deleting CloudWatch log groups..."
for group in /ecs/${PROJECT}-backend /ecs/${PROJECT}-frontend /ecs/${PROJECT}-agent; do
    aws logs delete-log-group --log-group-name "$group" --region "$REGION" &>/dev/null || true
done
ok "CloudWatch log groups deleted"

# ── 7. Clean state file ─────────────────────────────────────────────────────
rm -f "$(dirname "$0")/.infra-state.json"

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  Teardown complete. All resources removed.               ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${YELLOW}Note:${NC} Default VPC was NOT deleted (shared resource)."
echo -e "  ${YELLOW}Note:${NC} S3 bucket and DynamoDB table were NOT deleted (managed by infra/setup.sh)."
echo ""
