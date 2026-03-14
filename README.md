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
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#architecture">Architecture</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="docs/">Documentation</a>
</p>

---

## The Problem

Enterprise professionals — insurance adjusters, paralegals, financial analysts — spend **30+ hours per week** manually cross-referencing documents, hunting for discrepancies, and writing findings reports. It's slow, error-prone, and soul-crushing.

## The Solution

DocuVoice lets you **upload documents and have a voice conversation** with an AI agent that has already read, understood, and cross-referenced everything. It surfaces discrepancies, anomalies, and red flags in real-time — while you talk.

> Upload a claim file, a policy, medical bills, and a police report. Ask: *"Are there any inconsistencies between the claimant's statement and the police report?"* — and get an instant, cited answer.

---

## Features

- **Voice-First Interface** — Natural conversation powered by Amazon Nova Sonic 2 (speech-to-speech, 1M token context)
- **Intelligent Document Processing** — OCR, field extraction, and cross-document analysis via AWS Bedrock + LlamaParse
- **Real-Time Findings** — Discrepancies, anomalies, red flags surfaced during conversation with severity ratings and confidence scores
- **Domain Plugins** — Specialized analysis for insurance claims, legal contracts, financial due diligence, and HR compliance
- **Function Tools** — Agent can search documents, compare fields, calculate exposure, and flag red flags mid-conversation
- **Live Transcript** — Full session transcript with document references and tool call annotations
- **3-Panel Workspace** — Voice orb + transcript | resizable document panel | extracted fields and findings

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
│                  FastAPI · Pydantic v2                       │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Workspace   │  │   Document   │  │    LiveKit        │  │
│  │  Management  │  │  Processing  │  │    Token + Room   │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────────┘  │
│         │                │                   │              │
│  ┌──────▼────────────────▼───────────────────▼───────────┐  │
│  │              Repository Layer (DynamoDB / Memory)      │  │
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
│  │  Plugins    │  │   Injector   │  │   (search, compare, │ │
│  │             │  │              │  │    flag, summarize)  │ │
│  └────────────┘  └──────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     AWS Services                            │
│  S3 (uploads) · DynamoDB (data) · Bedrock (AI) · Textract  │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, LiveKit Client |
| **Backend** | FastAPI, Python 3.13+, Pydantic v2, UV package manager |
| **Voice Agent** | LiveKit Agents v1.4, Amazon Nova Sonic 2, Silero VAD |
| **AI/ML** | AWS Bedrock (Nova Pro), Instructor, LlamaParse, PyMuPDF |
| **Database** | DynamoDB (single-table design) |
| **Storage** | S3 (presigned uploads) |
| **Infra** | Docker Compose, App Runner, Vercel, LiveKit Cloud |

---

## Project Structure

```
docuvoice/
├── frontend/          # Next.js 16 app (pages, components, stores, hooks)
├── backend/           # FastAPI server (API, services, processing, repositories)
├── agents/            # LiveKit voice agent (plugins, tools, context injection)
├── infra/             # AWS setup scripts (S3, DynamoDB, IAM)
├── files/             # Sample documents for demo (insurance, legal, HR)
├── docs/              # Project documentation
│   ├── architecture/  #   Tech stack, system design
│   ├── design/        #   UX design system, component mapping
│   └── planning/      #   Task plans, roadmap
└── docker-compose.yml # Full-stack orchestration
```

---

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 20+
- [UV](https://docs.astral.sh/uv/) (Python package manager)
- [pnpm](https://pnpm.io/) (Node package manager)
- AWS account with Bedrock access enabled

### 1. Clone and configure

```bash
git clone <repo-url> && cd docuvoice
```

Create environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp agents/.env.example agents/.env
cp frontend/.env.example frontend/.env
```

Fill in your AWS credentials, LiveKit keys, and LlamaParse API key.

### 2. AWS infrastructure

```bash
cd infra && bash setup.sh
```

This creates the S3 bucket, DynamoDB table, and verifies Bedrock model access.

### 3. Start the backend

```bash
cd backend
uv sync
uv run python -m uvicorn app.main:app --reload --port 8000
```

### 4. Start the voice agent

```bash
cd agents
uv sync
uv run python -m agent.entrypoint dev
```

### 5. Start the frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — create a workspace, upload documents, and start talking.

### Docker (all-in-one)

```bash
docker compose up --build
```

---

## How It Works

```
Upload Documents ──► Processing Pipeline ──► Workspace Ready ──► Voice Session
                     │                                            │
                     ├─ Text extraction (PyMuPDF / LlamaParse)    ├─ Nova Sonic 2 (speech-to-speech)
                     ├─ Field extraction (Bedrock Nova Pro)       ├─ Context injection (1M tokens)
                     ├─ Cross-document analysis                   ├─ Function tool calls
                     └─ Findings generation                       └─ Real-time findings
```

1. **Upload** — Drop PDFs, images, or DOCX files into a workspace
2. **Process** — Backend extracts text, identifies fields, detects anomalies, and generates cross-document findings
3. **Talk** — Connect to a voice session; the agent has full context of all documents and findings
4. **Discover** — Ask questions, drill into discrepancies, get cited answers with confidence scores
5. **Review** — Findings, transcripts, and extracted fields are persisted for audit

---

## Domain Plugins

| Domain | Document Types | Key Analysis |
|--------|---------------|-------------|
| **Insurance Claims** | FNOL, policies, medical bills, police reports | Timeline inconsistencies, coverage gaps, exposure calculation |
| **Legal Contracts** | MSAs, amendments, NDAs, playbooks | Clause deviations, missing protections, liability exposure |
| **Financial DD** | P&L, balance sheets, audit reports, cap tables | Revenue anomalies, EBITDA adjustments, working capital issues |
| **HR Compliance** | Complaints, witness statements, policies, employee files | Pattern detection, policy violations, credibility assessment |

---

## API Overview

The backend exposes a RESTful API at `/api/v1/`:

| Endpoint | Description |
|----------|-------------|
| `POST /workspaces` | Create a new workspace |
| `POST /workspaces/:id/documents/upload` | Upload a document |
| `POST /workspaces/:id/prepare` | Trigger document processing pipeline |
| `GET /workspaces/:id/preparation-status` | Poll processing progress |
| `GET /workspaces/:id/extracted-fields` | Get all extracted fields |
| `GET /workspaces/:id/findings` | Get cross-document findings |
| `POST /livekit/token` | Generate voice session token |
| `GET /sessions/:id/transcript` | Get session transcript |
| `GET /workspaces/:id/context` | Get pre-built agent context |

Full API docs available at `http://localhost:8000/docs` when running.

---

## Environment Variables

<details>
<summary><strong>Backend</strong> (<code>backend/.env</code>)</summary>

```env
APP_ENV=development
APP_PORT=8000
CORS_ORIGINS=["http://localhost:3000"]
STORAGE_BACKEND=memory          # or "dynamodb"

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET_NAME=
DYNAMODB_TABLE_NAME=docuvoice-main

# AI
BEDROCK_MODEL_ID=us.amazon.nova-pro-v1:0
LLAMA_CLOUD_API_KEY=

# LiveKit
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

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET_NAME=
DYNAMODB_TABLE_NAME=docuvoice-main
```

</details>

<details>
<summary><strong>Frontend</strong> (<code>frontend/.env</code>)</summary>

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_LIVEKIT_URL=
```

</details>

---

## Documentation

| Document | Description |
|----------|-------------|
| [Tech Stack](docs/architecture/tech-stack.md) | Full technical architecture, module dependency map, API spec |
| [System Design](docs/architecture/system-design-v1.0.docx) | System design document (v1.0) |
| [UX Design System](docs/design/ux-design-system.md) | Color system, component mapping, animation tokens |
| [Use Cases](docs/use-cases.md) | Detailed personas, workflows, and plugin specifications |
| [Frontend Tasks](docs/planning/frontend-ux-tasks.md) | Development roadmap and task breakdown |

---

## License

Proprietary. All rights reserved.
