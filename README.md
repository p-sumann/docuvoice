<p align="center">
  <img src="frontend/public/logo.svg" alt="DocuVoice" width="60" />
</p>

<h1 align="center">DocuVoice</h1>

<p align="center">
  <strong>Talk to your documents. Surface what matters.</strong>
</p>

<p align="center">
  AI-powered voice-first document analysis platform that transforms hours of manual review into a 5-minute conversation.
</p>

<p align="center">
  <a href="https://novasonic-hackathon.sumanpaudel.me">Live Demo</a> &bull;
  <a href="#demo-video">Demo Video</a> &bull;
  <a href="#architecture">Architecture</a> &bull;
  <a href="#how-it-works">How It Works</a> &bull;
  <a href="#quick-start">Quick Start</a>
</p>

<p align="center">
  <strong>#AmazonNova</strong> &bull; Category: <strong>Voice AI</strong> &bull; Submitter Type: <strong>Professional Developer</strong>
</p>

---

## The Problem

Enterprise professionals — insurance adjusters, paralegals, financial analysts — spend **30+ hours per week** manually cross-referencing documents, hunting for discrepancies, and writing findings reports. A single insurance claim can involve 4-10 documents that need to be compared line-by-line: FNOLs, policies, medical bills, police reports. It's slow, error-prone, and costs the industry billions annually in missed fraud and delayed claims.

## The Solution

DocuVoice lets you **upload documents and have a real-time voice conversation** with an AI agent that has already read, understood, and cross-referenced everything. It surfaces discrepancies, anomalies, and red flags — while you talk.

> Upload a claim file, a policy, medical bills, and a police report. Ask: *"Are there any inconsistencies between the claimant's statement and the police report?"* — and get an instant, cited answer.

### What makes it different

- **Voice-first, not chat-first** — Adjusters work on the phone, in the field, and between meetings. Voice is their native interface.
- **Findings before questions** — The agent pre-analyzes documents before you even connect, so it leads with what matters.
- **Domain-aware tools** — The agent doesn't just answer questions — it can search documents, compare fields across files, calculate exposure ratios, and flag fraud patterns mid-conversation.

---

## Amazon Nova Integration

DocuVoice is built end-to-end on Amazon Nova foundation models:

| Model | Usage |
|-------|-------|
| **Amazon Nova Sonic 2** | Real-time speech-to-speech voice agent with 1M token context window. Powers the entire voice conversation including tool calling, document referencing, and natural adjuster-style dialogue. |
| **Amazon Nova Pro** | Document field extraction, cross-document findings generation, and structured AI analysis via AWS Bedrock Converse API + Instructor. |
| **Amazon Nova Lite** | Fast domain classification — validates uploaded documents belong to the workspace domain (e.g., rejects a recipe PDF uploaded to an insurance claim). |

### Why Nova Sonic 2

Nova Sonic 2's **speech-to-speech architecture** eliminates the traditional STT → LLM → TTS pipeline latency. Combined with its **1M token context window**, we can inject the full text of all documents directly into the conversation context — no RAG needed, no retrieval lag. The agent has perfect recall of every field, every number, every date across all documents, all the time.

---

## Features

- **Real-Time Voice Conversation** — Natural speech powered by Amazon Nova Sonic 2 (speech-to-speech, sub-second latency)
- **Intelligent Document Processing** — PyMuPDF for digital PDFs, AWS Textract fallback for scanned documents
- **Pre-Session Analysis** — Cross-document findings generated before the voice session starts
- **5 Finding Types** — Discrepancies, exposure risks, red flags, missing information, and anomalies — each with severity ratings
- **Agentic Function Tools** — Agent calls tools mid-conversation: `search_documents`, `compare_fields`, `calculate_exposure`, `flag_red_flags`, `generate_summary`
- **3-Panel Workspace** — Voice orb + live transcript | document viewer | extracted fields & findings
- **Session Persistence** — Full transcripts, findings, and metrics stored in DynamoDB for audit
- **Domain Plugin Architecture** — Extensible to legal, financial DD, HR compliance (insurance claims MVP)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│              Next.js 16 · React 19 · Tailwind v4            │
│         shadcn/ui · Zustand · LiveKit Client SDK            │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API + WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                        Backend                              │
│                  FastAPI · Python 3.13+                      │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Workspace   │  │   Document   │  │    LiveKit        │  │
│  │  Management  │  │  Processing  │  │    Token + Room   │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────────┘  │
│         │                │                   │              │
│  ┌──────▼────────────────▼───────────────────▼───────────┐  │
│  │              Repository Layer (DynamoDB)               │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Voice Agent                            │
│           LiveKit Agents v1.4 · Nova Sonic 2                │
│                    Silero VAD                                │
│                                                             │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  Domain     │  │   Context    │  │   Function Tools    │ │
│  │  Plugins    │  │   Builder    │  │   (search, compare, │ │
│  │             │  │   (1M ctx)   │  │    expose, flag)    │ │
│  └────────────┘  └──────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     AWS Services                            │
│  S3 (uploads) · DynamoDB (data) · Bedrock (Nova Pro/Lite)   │
│                 Textract (OCR fallback)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, LiveKit Client SDK |
| **Backend** | FastAPI, Python 3.13+, Pydantic v2, structlog, Instructor |
| **Voice Agent** | LiveKit Agents v1.4, Amazon Nova Sonic 2, Silero VAD |
| **AI Models** | Amazon Nova Sonic 2 (voice), Nova Pro (extraction/findings), Nova Lite (classification) |
| **Document Processing** | PyMuPDF4LLM, AWS Textract (OCR fallback) |
| **Database** | AWS DynamoDB (single-table design) |
| **Storage** | AWS S3 (presigned uploads, 50MB max) |
| **Infrastructure** | Docker Compose, Caddy (reverse proxy + auto-TLS), EC2, ECR |

---

## How It Works

### 1. Upload Documents
Drop PDFs into a workspace — FNOL, policy, medical bills, police report. Files upload to S3 via presigned URLs.

### 2. AI Processing Pipeline
```
Extract Text (PyMuPDF / Textract)
    → Validate Domain (Nova Lite — rejects off-topic docs)
    → Extract Fields (Nova Pro — structured key-value pairs with anomaly flags)
    → Generate Findings (Nova Pro — cross-document discrepancies, exposure, red flags)
    → Workspace Ready
```

### 3. Voice Session
Connect to a voice session. Nova Sonic 2 has the full document context (1M tokens) and pre-generated findings. The agent:
- Greets you with a count of documents and key findings
- Answers questions with cited references to specific documents
- Calls tools mid-conversation (search, compare, calculate, flag)
- Generates adjuster notes on request

### 4. Review
Session transcripts, findings, and extracted fields are persisted in DynamoDB. Review past sessions, export findings, drill into document details.

---

## Demo Scenario: Insurance Claim Review

**Documents uploaded:**
- First Notice of Loss (FNOL)
- Insurance Policy (AUT-2024-00789)
- Medical Bills (Springfield Ortho)
- Police Report (SPD-2024-05678)

**What the agent finds automatically:**
| Finding | Type | Severity |
|---------|------|----------|
| FNOL reports 2 passengers, police report says 3 | Discrepancy | Critical |
| Medical costs ($47K) at 94% of BI limit ($50K) | Exposure | High |
| Treatment started before accident date on record | Red Flag | High |
| Missing witness statement referenced in police report | Missing | Medium |

**Sample conversation:**
> **You:** "Walk me through this claim — what are we looking at?"
>
> **Agent:** "Got four documents loaded. Two things jump out right away — passenger count doesn't match between the FNOL and police report, and medical's running at 47K against a 50K BI limit. Want me to dig into either one?"
>
> **You:** "Tell me about the passenger discrepancy."
>
> **Agent:** "FNOL filed by the claimant lists two passengers. Police report from the scene says three. That's a classic red flag — could indicate a passenger was added after the fact to inflate the claim."

---

## Project Structure

```
docuvoice/
├── frontend/          # Next.js 16 (pages, components, stores, hooks)
├── backend/           # FastAPI (API routes, services, AI processing, DynamoDB)
├── agents/            # LiveKit voice agent (plugins, tools, context builder)
├── deploy/            # Docker Compose, Caddyfile, ECR scripts, EC2 setup
├── files/             # Sample insurance documents for demo
└── docker-compose.yml # Local development orchestration
```

---

## Quick Start

### Prerequisites

- Python 3.13+, Node.js 20+, Docker
- AWS account with Bedrock access (Nova Pro, Nova Lite, Nova Sonic 2)
- LiveKit Cloud account (or self-hosted LiveKit server)

### Local Development

```bash
# Clone
git clone https://github.com/sumanpaudel1997/docuvoice.git && cd docuvoice

# Configure environment
cp backend/.env.example backend/.env
cp agents/.env.example agents/.env
# Fill in AWS credentials, LiveKit keys

# Start all services
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) — create a workspace, upload documents, and start talking.

### Production Deployment

```bash
# Build and push to ECR
./deploy/build-and-push.sh

# On EC2: pull and run
./deploy/pull-and-run.sh
```

See [deploy/DEPLOY.md](deploy/DEPLOY.md) for full production deployment guide.

---

## Environment Variables

<details>
<summary><strong>Backend</strong> (<code>backend/.env</code>)</summary>

```env
APP_ENV=development
STORAGE_BACKEND=memory          # or "dynamodb"
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET_NAME=docuvoice-uploads
DYNAMODB_TABLE_NAME=docuvoice-main
BEDROCK_MODEL_ID=us.amazon.nova-pro-v1:0
BEDROCK_LITE_MODEL_ID=us.amazon.nova-lite-v1:0
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

</details>

<details>
<summary><strong>Agent</strong> (<code>agents/.env</code>)</summary>

```env
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
BACKEND_URL=http://localhost:8000
AWS_DEFAULT_REGION=us-east-1
```

</details>

<details>
<summary><strong>Frontend</strong> (<code>frontend/.env</code>)</summary>

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

</details>

---

## License

MIT License. See [LICENSE](LICENSE) for details.
