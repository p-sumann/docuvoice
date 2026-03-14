#!/usr/bin/env bash
# DocuVoice EC2 Production Setup
# Run this ON the EC2 instance after SSH'ing in.
# Tested on: Amazon Linux 2023 / Ubuntu 22.04+
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

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║  DocuVoice — EC2 Production Setup         ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Detect OS ─────────────────────────────────────────────────────────────
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    fail "Cannot detect OS"
fi
info "Detected OS: $OS"

# ── 2. Install Docker ────────────────────────────────────────────────────────
if command -v docker &>/dev/null; then
    ok "Docker already installed: $(docker --version)"
else
    info "Installing Docker..."
    if [[ "$OS" == "amzn" ]]; then
        sudo yum update -y
        sudo yum install -y docker
        sudo systemctl enable docker
        sudo systemctl start docker
        sudo usermod -aG docker "$USER"
    elif [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/$OS/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" | \
            sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        sudo usermod -aG docker "$USER"
    else
        fail "Unsupported OS: $OS. Install Docker manually."
    fi
    ok "Docker installed"
fi

# ── 3. Install Docker Compose plugin ─────────────────────────────────────────
if docker compose version &>/dev/null; then
    ok "Docker Compose plugin available: $(docker compose version)"
else
    info "Installing Docker Compose plugin..."
    COMPOSE_VERSION="v2.32.4"
    sudo mkdir -p /usr/local/lib/docker/cli-plugins
    sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    ok "Docker Compose installed"
fi

# ── 4. Install Git ───────────────────────────────────────────────────────────
if command -v git &>/dev/null; then
    ok "Git already installed"
else
    info "Installing Git..."
    if [[ "$OS" == "amzn" ]]; then
        sudo yum install -y git
    else
        sudo apt-get install -y git
    fi
    ok "Git installed"
fi

# ── 5. Open ports 80 + 443 ──────────────────────────────────────────────────
info "Reminder: Ensure your EC2 Security Group allows inbound TCP 80 and 443"
info "Also allow TCP 22 for SSH"

# ── 6. Clone or update repo ─────────────────────────────────────────────────
APP_DIR="$HOME/docuvoice"
if [ -d "$APP_DIR" ]; then
    info "Updating existing repo at $APP_DIR..."
    cd "$APP_DIR"
    git pull
else
    info "Clone your repo to $APP_DIR:"
    echo -e "  ${BOLD}git clone <your-repo-url> $APP_DIR${NC}"
    echo -e "  ${BOLD}cd $APP_DIR${NC}"
fi

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  EC2 setup complete!                          ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Clone your repo:          ${BOLD}git clone <repo> ~/docuvoice && cd ~/docuvoice${NC}"
echo -e "  2. Copy env files:           ${BOLD}cp backend/.env.example backend/.env${NC}"
echo -e "  3. Edit env files with your secrets"
echo -e "  4. Deploy:                   ${BOLD}./deploy/deploy.sh${NC}"
echo ""
echo -e "${YELLOW}NOTE:${NC} If you just added yourself to the docker group,"
echo -e "log out and back in for it to take effect: ${BOLD}exit${NC} then SSH back in."
echo ""
