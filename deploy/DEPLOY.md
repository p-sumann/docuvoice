# DocuVoice — Production Deployment Guide

## Architecture

```
                    novasonic-hackathon.sumanpaudel.me
                              │
                              ▼
                    ┌─────────────────┐
                    │   Caddy (443)   │  Auto-SSL via Let's Encrypt
                    │  Reverse Proxy  │  HTTP/2, HTTP/3 (QUIC)
                    └──┬──────────┬───┘
                       │          │
                  /api/*      /* (all else)
                       │          │
                       ▼          ▼
                 ┌──────────┐ ┌──────────┐
                 │ Backend  │ │ Frontend │
                 │ FastAPI  │ │ Next.js  │
                 │ :8000    │ │ :3000    │
                 └────┬─────┘ └──────────┘
                      │
          ┌───────────┼──────────┐
          ▼           ▼          ▼
     ┌─────────┐ ┌─────────┐ ┌──────────┐
     │DynamoDB │ │   S3    │ │ Bedrock  │
     └─────────┘ └─────────┘ │ Textract │
                              └──────────┘

     LiveKit Cloud ← Agent (hosted on LK Cloud)
```

## Prerequisites

- AWS Account with Bedrock Nova models enabled
- EC2 instance (recommended: `t3.medium` or `c6i.large`, us-east-1)
- Domain DNS pointing to EC2 public IP
- LiveKit Cloud account with agent deployed

## Quick Deploy (15 minutes)

### 1. Launch EC2

```bash
# Launch a t3.medium in us-east-1 with Amazon Linux 2023 or Ubuntu 22.04
# Security Group: allow inbound TCP 22, 80, 443
```

**Recommended instance**: `t3.medium` (2 vCPU, 4 GB RAM) — enough for hackathon traffic. Use `c6i.large` if you expect concurrent voice sessions + heavy document processing.

### 2. Point DNS

Create an A record:
```
novasonic-hackathon.sumanpaudel.me → <EC2_PUBLIC_IP>
```

### 3. SSH in and set up

```bash
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Run setup script (installs Docker, Docker Compose, Git)
bash deploy/setup-ec2.sh
# Log out and back in for docker group to take effect
exit
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>
```

### 4. Clone repo and configure

```bash
git clone <your-repo-url> ~/docuvoice
cd ~/docuvoice

# Copy and edit environment files
cp deploy/.env.production.example backend/.env
nano backend/.env   # Fill in AWS creds, LiveKit keys, etc.

# If self-hosting agent (skip if using LiveKit Cloud):
# cp deploy/.env.production.example agents/.env
# nano agents/.env
```

### 5. Update S3 CORS

```bash
# Export your AWS creds first, then:
bash deploy/update-s3-cors.sh
```

### 6. Deploy

```bash
./deploy/deploy.sh
```

That's it. Caddy auto-provisions SSL on the first request (~30 seconds).

Visit: **https://novasonic-hackathon.sumanpaudel.me**

## Operations

### View logs
```bash
docker compose -f docker-compose.prod.yml logs -f           # All
docker compose -f docker-compose.prod.yml logs -f backend    # Backend only
docker compose -f docker-compose.prod.yml logs -f caddy      # SSL/proxy logs
```

### Restart a service
```bash
docker compose -f docker-compose.prod.yml restart backend
```

### Redeploy after code changes
```bash
cd ~/docuvoice
git pull
./deploy/deploy.sh
```

### Stop everything
```bash
docker compose -f docker-compose.prod.yml down
```

## AWS Credentials Note

For the hackathon, temporary session credentials work. They expire, so you'll need to update `backend/.env` when they rotate.

For a more permanent setup, attach an **IAM Instance Profile** to the EC2 with permissions for: S3, DynamoDB, Bedrock, Textract. Then remove the `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN` from `.env` — boto3 picks up the instance role automatically.

## Cost Estimate (Hackathon)

| Resource | Cost |
|----------|------|
| EC2 t3.medium | ~$0.04/hr ($1/day) |
| DynamoDB (on-demand) | ~$0 (free tier) |
| S3 | ~$0 (pennies) |
| Bedrock Nova Sonic 2 | Per-token (varies) |
| Caddy SSL | Free (Let's Encrypt) |
| **Total for 3-day hackathon** | **~$5-10** |
