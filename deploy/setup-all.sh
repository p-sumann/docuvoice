#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# DocuVoice — Full AWS Infrastructure Setup (Idempotent)
# Creates: VPC, Security Group, IAM Role, ECR Repos, CloudWatch Logs, EC2
# Usage: ./deploy/setup-all.sh
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

REGION="us-east-1"
PROJECT="docuvoice"
INSTANCE_TYPE="t3.large"
VOLUME_SIZE=30
DOMAIN="novasonic-hackathon.sumanpaudel.me"

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

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_FILE="$SCRIPT_DIR/.infra-state.json"

# ── Save/load state so we can resume or reference later ──────────────────────
save_state() { echo "$STATE" > "$STATE_FILE"; }
if [ -f "$STATE_FILE" ]; then
    STATE=$(cat "$STATE_FILE")
else
    STATE='{}'
fi
get() { echo "$STATE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$1',''))" 2>/dev/null || echo ""; }
set_val() { STATE=$(echo "$STATE" | python3 -c "import sys,json; d=json.load(sys.stdin); d['$1']='$2'; json.dump(d,sys.stdout)"); save_state; }

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║  DocuVoice — Full AWS Infrastructure Setup               ║${NC}"
echo -e "${CYAN}${BOLD}║  Region: ${REGION}  |  Instance: ${INSTANCE_TYPE}               ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── 0. Pre-flight ────────────────────────────────────────────────────────────
command -v aws &>/dev/null || fail "AWS CLI not found. Install: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
aws sts get-caller-identity &>/dev/null || fail "AWS credentials not configured. Run: aws configure"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
info "Account: $ACCOUNT_ID | Region: $REGION"

# ── 1. VPC ───────────────────────────────────────────────────────────────────
info "Checking VPC..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" \
    --query 'Vpcs[0].VpcId' --output text --region "$REGION" 2>/dev/null)

if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    info "No default VPC found. Creating..."
    VPC_ID=$(aws ec2 create-default-vpc --region "$REGION" --query 'Vpc.VpcId' --output text)
    sleep 5  # Wait for subnets to propagate
fi
set_val "vpc_id" "$VPC_ID"
ok "VPC: $VPC_ID"

# Pick first public subnet
SUBNET_ID=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=map-public-ip-on-launch,Values=true" \
    --query 'Subnets[0].SubnetId' --output text --region "$REGION")
set_val "subnet_id" "$SUBNET_ID"
ok "Subnet: $SUBNET_ID"

# ── 2. Security Group ───────────────────────────────────────────────────────
info "Checking security group..."
SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT}-ec2-sg" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text --region "$REGION" 2>/dev/null)

if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
    SG_ID=$(aws ec2 create-security-group \
        --group-name "${PROJECT}-ec2-sg" \
        --description "DocuVoice EC2 - HTTP, HTTPS, SSH" \
        --vpc-id "$VPC_ID" \
        --region "$REGION" \
        --query 'GroupId' --output text)

    for PORT in 22 80 443; do
        aws ec2 authorize-security-group-ingress \
            --group-id "$SG_ID" --protocol tcp --port "$PORT" \
            --cidr 0.0.0.0/0 --region "$REGION" &>/dev/null
    done
fi
set_val "sg_id" "$SG_ID"
ok "Security Group: $SG_ID (ports 22, 80, 443)"

# ── 3. IAM Role + Instance Profile ──────────────────────────────────────────
info "Checking IAM role..."
ROLE_NAME="${PROJECT}-ec2-role"
PROFILE_NAME="${PROJECT}-ec2-profile"

if ! aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
        &>/dev/null
    sleep 3  # IAM propagation

    for policy in \
        arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly \
        arn:aws:iam::aws:policy/AmazonS3FullAccess \
        arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess \
        arn:aws:iam::aws:policy/AmazonTextractFullAccess \
        arn:aws:iam::aws:policy/AmazonBedrockFullAccess \
        arn:aws:iam::aws:policy/CloudWatchLogsFullAccess; do
        aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "$policy"
    done
fi
ok "IAM Role: $ROLE_NAME"

if ! aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" &>/dev/null; then
    aws iam create-instance-profile --instance-profile-name "$PROFILE_NAME" &>/dev/null
    aws iam add-role-to-instance-profile \
        --instance-profile-name "$PROFILE_NAME" --role-name "$ROLE_NAME" &>/dev/null
    sleep 10  # Instance profile propagation (important!)
fi
set_val "iam_profile" "$PROFILE_NAME"
ok "Instance Profile: $PROFILE_NAME"

# ── 4. ECR Repositories ─────────────────────────────────────────────────────
info "Checking ECR repos..."
for repo in ${PROJECT}-backend ${PROJECT}-frontend ${PROJECT}-agent; do
    aws ecr describe-repositories --repository-names "$repo" --region "$REGION" &>/dev/null || \
    aws ecr create-repository --repository-name "$repo" --region "$REGION" \
        --image-scanning-configuration scanOnPush=false &>/dev/null
done
set_val "ecr_registry" "$ECR_REGISTRY"
ok "ECR: ${ECR_REGISTRY}/${PROJECT}-{backend,frontend,agent}"

# ── 5. CloudWatch Log Groups ────────────────────────────────────────────────
info "Checking CloudWatch log groups..."
for group in /ecs/${PROJECT}-backend /ecs/${PROJECT}-frontend /ecs/${PROJECT}-agent; do
    aws logs create-log-group --log-group-name "$group" --region "$REGION" &>/dev/null || true
done
ok "CloudWatch log groups ready"

# ── 6. SSH Key Pair ──────────────────────────────────────────────────────────
info "Checking SSH key pair..."
KEY_NAME="${PROJECT}-key"
KEY_FILE="$SCRIPT_DIR/${KEY_NAME}.pem"

if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$REGION" &>/dev/null; then
    aws ec2 create-key-pair \
        --key-name "$KEY_NAME" \
        --query 'KeyMaterial' --output text \
        --region "$REGION" > "$KEY_FILE"
    chmod 400 "$KEY_FILE"
    ok "Key pair created: $KEY_FILE"
else
    if [ -f "$KEY_FILE" ]; then
        ok "Key pair exists: $KEY_FILE"
    else
        warn "Key pair '$KEY_NAME' exists in AWS but local .pem not found at $KEY_FILE"
        warn "You'll need the original .pem file to SSH in"
    fi
fi
set_val "key_name" "$KEY_NAME"
set_val "key_file" "$KEY_FILE"

# ── 7. S3 CORS ──────────────────────────────────────────────────────────────
info "Updating S3 CORS..."
S3_BUCKET="${PROJECT}-uploads-${ACCOUNT_ID}"
if aws s3api head-bucket --bucket "$S3_BUCKET" --region "$REGION" &>/dev/null; then
    aws s3api put-bucket-cors --bucket "$S3_BUCKET" --region "$REGION" \
        --cors-configuration '{
            "CORSRules": [{
                "AllowedOrigins": ["http://localhost:3000","https://'"$DOMAIN"'"],
                "AllowedMethods": ["GET","PUT","POST","HEAD","DELETE"],
                "AllowedHeaders": ["*"],
                "ExposeHeaders": ["ETag"],
                "MaxAgeSeconds": 3600
            }]
        }'
    ok "S3 CORS updated for $S3_BUCKET"
else
    warn "S3 bucket $S3_BUCKET not found — run infra/setup.sh first to create it"
fi

# ── 8. Launch EC2 ────────────────────────────────────────────────────────────
info "Checking for existing EC2 instance..."
EXISTING_ID=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=${PROJECT}-prod" "Name=instance-state-name,Values=running,stopped" \
    --query 'Reservations[0].Instances[0].InstanceId' --output text --region "$REGION" 2>/dev/null)

if [ "$EXISTING_ID" != "None" ] && [ -n "$EXISTING_ID" ]; then
    INSTANCE_ID="$EXISTING_ID"
    warn "Existing instance found: $INSTANCE_ID"

    STATE_NAME=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].State.Name' --output text --region "$REGION")
    if [ "$STATE_NAME" = "stopped" ]; then
        info "Starting stopped instance..."
        aws ec2 start-instances --instance-ids "$INSTANCE_ID" --region "$REGION" &>/dev/null
        aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"
    fi
else
    # Get latest Amazon Linux 2023 AMI
    AMI_ID=$(aws ec2 describe-images --owners amazon \
        --filters "Name=name,Values=al2023-ami-2023*-x86_64" "Name=state,Values=available" \
        --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text --region "$REGION")

    USER_DATA=$(base64 << 'USERDATA'
#!/bin/bash
yum update -y
yum install -y docker git
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/v2.32.4/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
touch /home/ec2-user/.docker-ready
USERDATA
)

    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id "$AMI_ID" \
        --instance-type "$INSTANCE_TYPE" \
        --key-name "$KEY_NAME" \
        --security-group-ids "$SG_ID" \
        --subnet-id "$SUBNET_ID" \
        --iam-instance-profile Name="$PROFILE_NAME" \
        --associate-public-ip-address \
        --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":'"$VOLUME_SIZE"',"VolumeType":"gp3"}}]' \
        --user-data "$USER_DATA" \
        --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value='"${PROJECT}-prod"'}]' \
        --region "$REGION" \
        --query 'Instances[0].InstanceId' --output text)

    info "Instance launching: $INSTANCE_ID"
    aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"
fi

PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text --region "$REGION")

set_val "instance_id" "$INSTANCE_ID"
set_val "public_ip" "$PUBLIC_IP"
ok "EC2: $INSTANCE_ID ($INSTANCE_TYPE) at $PUBLIC_IP"

# ── Done ─────────────────────────────────────────────────────────────────────
save_state

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  Infrastructure Ready!                                        ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Account:${NC}     $ACCOUNT_ID"
echo -e "  ${BOLD}Region:${NC}      $REGION"
echo -e "  ${BOLD}VPC:${NC}         $VPC_ID"
echo -e "  ${BOLD}EC2:${NC}         $INSTANCE_ID ($INSTANCE_TYPE)"
echo -e "  ${BOLD}Public IP:${NC}   $PUBLIC_IP"
echo -e "  ${BOLD}IAM Role:${NC}    $ROLE_NAME"
echo -e "  ${BOLD}ECR:${NC}         $ECR_REGISTRY"
echo ""
echo -e "  ${YELLOW}DNS:${NC} Point ${BOLD}${DOMAIN}${NC} → ${BOLD}${PUBLIC_IP}${NC}"
echo ""
echo -e "  ${YELLOW}SSH:${NC} ${BOLD}ssh -i $KEY_FILE ec2-user@${PUBLIC_IP}${NC}"
echo ""
echo -e "  ${YELLOW}Next:${NC}"
echo -e "    1. Point DNS A record: ${DOMAIN} → ${PUBLIC_IP}"
echo -e "    2. Build & push:  ${BOLD}./deploy/build-and-push.sh${NC}"
echo -e "    3. SSH in & run:  ${BOLD}./deploy/pull-and-run.sh${NC}"
echo ""
echo -e "  State saved to: $STATE_FILE"
echo ""
