# DocuVoice — Complete Tech Stack & Module Specification
# Version: 1.0 | Date: Feb 2026 | Hackathon: Amazon Nova AI

---

## MONOREPO STRUCTURE

```
docuvoice/
├── README.md
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       └── backend-ci.yml
│
├── frontend/                    # Next.js 16 App
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── components.json          # shadcn/ui config + Agents UI registry
│   ├── .env.local
│   │
│   ├── public/
│   │   ├── logo.svg
│   │   └── og-image.png
│   │
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── layout.tsx       # Root layout (dark theme, fonts, providers)
│   │   │   ├── page.tsx         # Landing page (marketing)
│   │   │   ├── globals.css      # Tailwind + custom animations
│   │   │   │
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   │   │
│   │   │   ├── (dashboard)/     # Protected routes
│   │   │   │   ├── layout.tsx   # Dashboard shell (sidebar + topbar)
│   │   │   │   ├── page.tsx     # Dashboard home (workspace list)
│   │   │   │   │
│   │   │   │   ├── workspace/
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx           # Workspace creation wizard
│   │   │   │   │   └── [workspaceId]/
│   │   │   │   │       ├── page.tsx           # ★ MAIN WORKSPACE VIEW
│   │   │   │   │       ├── sessions/
│   │   │   │   │       │   ├── page.tsx       # Session history list
│   │   │   │   │       │   └── [sessionId]/
│   │   │   │   │       │       └── page.tsx   # Session detail + transcript
│   │   │   │   │       └── settings/
│   │   │   │   │           └── page.tsx       # Workspace settings
│   │   │   │   │
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx               # Global user settings
│   │   │   │
│   │   │   └── api/             # Next.js API routes (BFF)
│   │   │       ├── livekit-token/
│   │   │       │   └── route.ts              # Generate LiveKit participant tokens
│   │   │       ├── presigned-url/
│   │   │       │   └── route.ts              # Generate S3 presigned upload URLs
│   │   │       └── webhook/
│   │   │           └── livekit/
│   │   │               └── route.ts          # LiveKit webhook receiver
│   │   │
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui base components (auto-generated)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── sheet.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── command.tsx
│   │   │   │   └── toast.tsx
│   │   │   │
│   │   │   ├── agents-ui/       # LiveKit Agents UI components (from registry)
│   │   │   │   ├── agent-session-provider.tsx
│   │   │   │   ├── agent-control-bar.tsx
│   │   │   │   ├── agent-chat-transcript.tsx
│   │   │   │   ├── agent-audio-visualizer-bar.tsx
│   │   │   │   └── start-audio-button.tsx
│   │   │   │
│   │   │   ├── voice/           # ★ CUSTOM VOICE COMPONENTS
│   │   │   │   ├── voice-orb.tsx             # Hero orb with 7 states + animations
│   │   │   │   ├── voice-session.tsx         # LiveKit room wrapper + state mgmt
│   │   │   │   ├── voice-transcript.tsx      # Styled transcript with doc refs
│   │   │   │   ├── suggested-questions.tsx   # Contextual prompts
│   │   │   │   └── phone-call-banner.tsx     # Active SIP call indicator
│   │   │   │
│   │   │   ├── documents/       # DOCUMENT PANEL COMPONENTS
│   │   │   │   ├── document-card.tsx         # Upload/processing/ready states
│   │   │   │   ├── document-list.tsx         # Sortable doc list
│   │   │   │   ├── document-upload.tsx       # Drag-drop → S3 presigned
│   │   │   │   ├── extracted-fields.tsx      # KV display with anomaly highlights
│   │   │   │   └── document-preview.tsx      # PDF viewer modal
│   │   │   │
│   │   │   ├── findings/        # FINDINGS COMPONENTS
│   │   │   │   ├── finding-card.tsx          # Severity-colored finding
│   │   │   │   ├── finding-list.tsx          # Animated list
│   │   │   │   └── finding-detail.tsx        # Expanded finding view
│   │   │   │
│   │   │   ├── workspace/       # WORKSPACE COMPONENTS
│   │   │   │   ├── workspace-card.tsx        # Dashboard workspace card
│   │   │   │   ├── workspace-grid.tsx        # Dashboard workspace list
│   │   │   │   ├── workspace-wizard.tsx      # Multi-step creation wizard
│   │   │   │   ├── template-selector.tsx     # Domain template picker
│   │   │   │   └── plugin-config.tsx         # Source/action plugin config
│   │   │   │
│   │   │   ├── layout/          # LAYOUT COMPONENTS
│   │   │   │   ├── sidebar.tsx               # Main nav sidebar
│   │   │   │   ├── topbar.tsx                # Session status + workspace info
│   │   │   │   ├── command-palette.tsx       # Cmd+K global search
│   │   │   │   └── panel-resizer.tsx         # Draggable panel boundaries
│   │   │   │
│   │   │   └── landing/         # MARKETING COMPONENTS
│   │   │       ├── hero.tsx
│   │   │       ├── demo-widget.tsx           # Embedded live demo
│   │   │       ├── use-case-cards.tsx
│   │   │       ├── pricing-table.tsx
│   │   │       └── architecture-diagram.tsx
│   │   │
│   │   ├── hooks/               # CUSTOM HOOKS
│   │   │   ├── use-workspace.ts             # Workspace CRUD + state
│   │   │   ├── use-documents.ts             # Document upload + polling
│   │   │   ├── use-voice-session.ts         # LiveKit connection + orb state
│   │   │   ├── use-findings.ts              # Real-time findings via WebSocket
│   │   │   ├── use-presigned-upload.ts      # S3 presigned URL upload flow
│   │   │   └── use-session-history.ts       # Paginated session list
│   │   │
│   │   ├── lib/                 # UTILITIES
│   │   │   ├── api.ts                       # Axios client for FastAPI backend
│   │   │   ├── livekit.ts                   # LiveKit token helpers
│   │   │   ├── s3.ts                        # S3 presigned upload utilities
│   │   │   ├── utils.ts                     # General helpers (cn, formatTime)
│   │   │   └── constants.ts                 # Domain templates, config
│   │   │
│   │   ├── stores/              # ZUSTAND STATE MANAGEMENT
│   │   │   ├── workspace-store.ts           # Active workspace state
│   │   │   ├── voice-store.ts               # Voice session state (orb, transcript)
│   │   │   └── notification-store.ts        # Toast/alert management
│   │   │
│   │   └── types/               # TYPESCRIPT TYPES
│   │       ├── workspace.ts                 # Workspace, Document, Session types
│   │       ├── plugin.ts                    # Plugin config types
│   │       ├── finding.ts                   # Finding types
│   │       └── api.ts                       # API request/response types
│   │
│   └── Dockerfile               # Frontend container (optional)
│
├── backend/                     # FastAPI Application
│   ├── pyproject.toml           # Poetry/uv project config
│   ├── Dockerfile
│   ├── .env
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app factory + startup/shutdown
│   │   ├── config.py            # Pydantic Settings (env vars)
│   │   │
│   │   ├── api/                 # API ROUTES
│   │   │   ├── __init__.py
│   │   │   ├── deps.py          # Dependency injection (auth, db, s3)
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py    # v1 router aggregator
│   │   │   │   ├── workspaces.py     # CRUD /workspaces
│   │   │   │   ├── documents.py      # Upload, list, delete, reprocess
│   │   │   │   ├── sessions.py       # List sessions, get detail
│   │   │   │   ├── plugins.py        # List available plugins
│   │   │   │   ├── tokens.py         # Generate LiveKit tokens
│   │   │   │   └── health.py         # Health check
│   │   │   └── websocket.py     # WebSocket for real-time updates
│   │   │
│   │   ├── models/              # PYDANTIC MODELS (Request/Response + DB)
│   │   │   ├── __init__.py
│   │   │   ├── workspace.py     # WorkspaceCreate, WorkspaceResponse, WorkspaceConfig
│   │   │   ├── document.py      # DocumentUpload, DocumentResponse, ProcessingStatus
│   │   │   ├── session.py       # SessionResponse, SessionDetail, TranscriptEntry
│   │   │   ├── finding.py       # Finding, FindingSeverity
│   │   │   ├── plugin.py        # PluginConfig, DomainPluginInfo, SourcePluginInfo
│   │   │   └── common.py        # Pagination, ErrorResponse, BaseTimestamped
│   │   │
│   │   ├── services/            # BUSINESS LOGIC
│   │   │   ├── __init__.py
│   │   │   ├── workspace_service.py     # Workspace CRUD + phone assignment
│   │   │   ├── document_service.py      # Upload flow, presigned URLs, reprocess
│   │   │   ├── processing_service.py    # ★ Textract + Schema Mapper + Context Builder
│   │   │   ├── session_service.py       # Session CRUD + transcript retrieval
│   │   │   ├── token_service.py         # LiveKit token generation
│   │   │   └── export_service.py        # PDF/markdown export (P2)
│   │   │
│   │   ├── repositories/        # DATA ACCESS (DynamoDB)
│   │   │   ├── __init__.py
│   │   │   ├── base.py          # Base repository (boto3 DynamoDB client)
│   │   │   ├── workspace_repo.py     # Workspace table operations
│   │   │   ├── document_repo.py      # Document table operations
│   │   │   ├── session_repo.py       # Session + finding table operations
│   │   │   └── plugin_repo.py        # Plugin config operations
│   │   │
│   │   ├── aws/                 # AWS SERVICE CLIENTS
│   │   │   ├── __init__.py
│   │   │   ├── s3.py            # S3 client (upload, download, presigned URLs)
│   │   │   ├── dynamodb.py      # DynamoDB client (single-table helpers)
│   │   │   ├── textract.py      # Textract client (AnalyzeDocument wrapper)
│   │   │   ├── bedrock.py       # Bedrock client (Nova Lite 2 for extraction)
│   │   │   ├── secrets.py       # Secrets Manager client
│   │   │   └── cloudwatch.py    # CloudWatch metrics/logging
│   │   │
│   │   ├── processing/          # ★ DOCUMENT PROCESSING PIPELINE
│   │   │   ├── __init__.py
│   │   │   ├── pipeline.py      # Orchestrator: upload → textract → map → build
│   │   │   ├── textract_parser.py    # Parse Textract JSON → structured data
│   │   │   ├── schema_mapper.py      # Apply domain extraction rules to Textract output
│   │   │   ├── context_builder.py    # Build flattened text for 1M context injection
│   │   │   └── field_post_processors.py  # Currency, date, number normalization
│   │   │
│   │   └── middleware/          # MIDDLEWARE
│   │       ├── __init__.py
│   │       ├── auth.py          # JWT verification (Cognito/Clerk)
│   │       ├── tenant.py        # Tenant isolation enforcement
│   │       ├── cors.py          # CORS configuration
│   │       ├── logging.py       # Structured logging (CloudWatch)
│   │       └── rate_limit.py    # Per-tenant rate limiting
│   │
│   ├── scripts/                 # UTILITY SCRIPTS
│   │   ├── create_table.py      # DynamoDB table creation
│   │   ├── create_bucket.py     # S3 bucket + CORS setup
│   │   ├── seed_data.py         # Demo data for hackathon
│   │   └── test_textract.py     # Textract integration test
│   │
│   └── tests/
│       ├── conftest.py
│       ├── test_workspaces.py
│       ├── test_documents.py
│       ├── test_processing.py
│       └── test_schema_mapper.py
│
├── agent/                       # ★ LiveKit Voice Agent (Separate Service)
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── .env
│   │
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── entrypoint.py        # ★ Main: JobContext → workspace → plugins → agent
│   │   ├── config.py            # Agent-specific settings
│   │   │
│   │   ├── plugins/             # ★ PLUGIN FRAMEWORK
│   │   │   ├── __init__.py
│   │   │   ├── base.py          # Abstract base classes (DomainPlugin, SourcePlugin, ActionPlugin)
│   │   │   ├── registry.py      # PluginRegistry: resolve, build_tools, build_prompt
│   │   │   │
│   │   │   ├── domains/         # DOMAIN PLUGINS
│   │   │   │   ├── __init__.py
│   │   │   │   ├── insurance_claims.py   # ★ Full implementation (MVP)
│   │   │   │   ├── legal_contracts.py    # Stub (future)
│   │   │   │   ├── financial_dd.py       # Stub (future)
│   │   │   │   └── custom.py             # Generic domain (user-defined)
│   │   │   │
│   │   │   ├── sources/         # SOURCE PLUGINS
│   │   │   │   ├── __init__.py
│   │   │   │   ├── s3_source.py          # Read from S3 (default)
│   │   │   │   ├── google_drive.py       # OAuth2 Google Drive sync (future)
│   │   │   │   └── webhook.py            # Webhook-triggered doc ingest (future)
│   │   │   │
│   │   │   └── actions/         # ACTION PLUGINS
│   │   │       ├── __init__.py
│   │   │       ├── slack_notifier.py     # Send Slack message on finding
│   │   │       └── email_ses.py          # Send email via SES (future)
│   │   │
│   │   ├── context/             # CONTEXT MANAGEMENT
│   │   │   ├── __init__.py
│   │   │   ├── builder.py       # Load workspace context from S3
│   │   │   ├── injector.py      # Cross-modal text injection to Nova Sonic 2
│   │   │   └── session_memory.py # In-session memory (findings, refs)
│   │   │
│   │   ├── tools/               # ★ FUNCTION TOOLS (decorated with @function_tool)
│   │   │   ├── __init__.py
│   │   │   ├── search_documents.py    # Search across workspace documents
│   │   │   ├── compare_fields.py      # Cross-document field comparison
│   │   │   ├── calculate_exposure.py  # Insurance-specific: exposure calc
│   │   │   ├── flag_red_flags.py      # Anomaly detection
│   │   │   └── generate_summary.py    # Adjuster notes generation
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── dynamo.py        # Shared DynamoDB access for agent
│   │       ├── s3.py            # S3 access for loading contexts
│   │       └── metrics.py       # Call duration, tool usage tracking
│   │
│   └── tests/
│       ├── test_entrypoint.py
│       ├── test_plugins.py
│       └── test_tools.py
│
├── infra/                       # INFRASTRUCTURE AS CODE
│   ├── setup.sh                 # One-click AWS setup (DynamoDB, S3, IAM)
│   ├── teardown.sh              # Clean up all resources
│   ├── dynamodb/
│   │   └── create_tables.py     # Table + GSI creation
│   ├── s3/
│   │   └── create_bucket.py     # Bucket + CORS + lifecycle
│   └── iam/
│       └── policies.json        # Minimal IAM policies
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── DEMO_SCRIPT.md
│
├── demo/                        # HACKATHON DEMO ASSETS
│   ├── sample-docs/             # Pre-made insurance claim documents
│   │   ├── fnol-sample.pdf
│   │   ├── policy-sample.pdf
│   │   ├── medical-bills-sample.pdf
│   │   └── police-report-sample.pdf
│   ├── demo-script.md
│   └── backup-video/            # Pre-recorded fallback
│
└── docker-compose.yml           # Local development (backend + agent)
```

---

## FRONTEND TECH STACK

### Core Framework
```json
{
  "next": "16.x",
  "react": "19.x",
  "react-dom": "19.x",
  "typescript": "5.x"
}
```

### Styling & UI
```json
{
  "tailwindcss": "4.x",
  "@tailwindcss/postcss": "4.x",
  "class-variance-authority": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest",
  "lucide-react": "latest",
  "@radix-ui/react-*": "latest"
}
```
- **shadcn/ui** — Base component library (button, card, dialog, etc.)
- **LiveKit Agents UI** — Voice-specific components (via shadcn registry)

### LiveKit SDK
```json
{
  "livekit-client": "latest",
  "@livekit/components-react": "2.9.x",
  "@livekit/components-core": "latest"
}
```

### State Management
```json
{
  "zustand": "5.x"
}
```
- **Why Zustand over Redux/Jotai**: Minimal boilerplate, perfect for 3-4 stores, works with React 19.
- Stores: `workspace-store`, `voice-store`, `notification-store`

### Auth
```json
{
  "@clerk/nextjs": "6.x"
}
```
- **Why Clerk over Cognito on frontend**: 5 min setup, React hooks, pre-built UI, free 10K MAU.
- In production: swap Clerk → Cognito + next-auth. Backend validates either JWT.

### API Client
```json
{
  "axios": "1.x"
}
```
- Alternatively: native `fetch` with a thin wrapper. Axios gives interceptors, retry, better DX.

### PDF Preview (P2)
```json
{
  "react-pdf": "latest"
}
```

### Animations
- **CSS-only** for orb states (keyframes in globals.css)
- **Tailwind animate** for slide-in, fade effects
- No Framer Motion needed (keeps bundle small)

### Full package.json Dependencies
```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "livekit-client": "^2.9.0",
    "@livekit/components-react": "^2.9.0",
    "@livekit/components-core": "^0.12.0",
    "@clerk/nextjs": "^6.0.0",
    "zustand": "^5.0.0",
    "axios": "^1.7.0",
    "lucide-react": "^0.460.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0"
  }
}
```

### Environment Variables (.env.local)
```bash
# LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Backend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# S3 (for presigned URLs via API route)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=docuvoice-uploads
```

---

## BACKEND TECH STACK

### Core Framework
```toml
[tool.poetry.dependencies]
python = "^3.12"
fastapi = "^0.116.0"
uvicorn = {extras = ["standard"], version = "^0.34.0"}
pydantic = "^2.10.0"
pydantic-settings = "^2.7.0"
```

### AWS SDK
```toml
boto3 = "^1.36.0"
aioboto3 = "^13.0.0"           # Async boto3 for non-blocking I/O
```
- **boto3**: S3, DynamoDB, Textract, Bedrock, Secrets Manager, CloudWatch
- **aioboto3**: Async wrappers for FastAPI async endpoints

### LiveKit Server SDK
```toml
livekit-api = "^1.0.0"          # Server-side token generation
```

### Auth
```toml
python-jose = {extras = ["cryptography"], version = "^3.3.0"}  # JWT verification
httpx = "^0.28.0"               # HTTP client for Clerk/Cognito JWKS
```

### Document Processing
```toml
# Textract response parsing
amazon-textract-response-parser = "^1.0.0"    # Official AWS Textract parser
amazon-textract-prettyprinter = "^0.1.0"      # Human-readable Textract output
```

### Utilities
```toml
python-multipart = "^0.0.18"    # File upload handling
python-dotenv = "^1.0.0"        # .env file loading
structlog = "^24.0.0"           # Structured logging
tiktoken = "^0.8.0"             # Token counting for context window
```

### Testing
```toml
[tool.poetry.group.dev.dependencies]
pytest = "^8.0.0"
pytest-asyncio = "^0.24.0"
httpx = "^0.28.0"               # TestClient
moto = "^5.0.0"                 # AWS service mocks
```

### Full pyproject.toml
```toml
[tool.poetry]
name = "docuvoice-backend"
version = "1.0.0"
description = "DocuVoice API Server"
python = "^3.12"

[tool.poetry.dependencies]
python = "^3.12"
fastapi = "^0.116.0"
uvicorn = {extras = ["standard"], version = "^0.34.0"}
pydantic = "^2.10.0"
pydantic-settings = "^2.7.0"
boto3 = "^1.36.0"
aioboto3 = "^13.0.0"
livekit-api = "^1.0.0"
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
httpx = "^0.28.0"
python-multipart = "^0.0.18"
python-dotenv = "^1.0.0"
structlog = "^24.0.0"
tiktoken = "^0.8.0"
amazon-textract-response-parser = "^1.0.0"
```

### Environment Variables (.env)
```bash
# App
APP_ENV=development
APP_PORT=8000
CORS_ORIGINS=http://localhost:3000

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1

# S3
S3_BUCKET_NAME=docuvoice-uploads
S3_PRESIGNED_EXPIRY=300

# DynamoDB
DYNAMODB_TABLE_NAME=docuvoice-main

# LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Auth
CLERK_SECRET_KEY=sk_test_...
CLERK_JWKS_URL=https://your-clerk-instance.clerk.accounts.dev/.well-known/jwks.json

# Bedrock
BEDROCK_REGION=us-east-1
NOVA_LITE_MODEL_ID=amazon.nova-2-lite-v1:0
```

---

## AGENT TECH STACK

### Core Framework
```toml
[tool.poetry.dependencies]
python = "^3.12"
livekit-agents = "^1.0.0"
livekit-plugins-aws = {extras = ["realtime"], version = "^1.2.0"}
```

### AWS SDK (Agent needs its own access)
```toml
boto3 = "^1.36.0"
aioboto3 = "^13.0.0"
```

### Utilities
```toml
tiktoken = "^0.8.0"
structlog = "^24.0.0"
pydantic = "^2.10.0"
```

### Full pyproject.toml
```toml
[tool.poetry]
name = "docuvoice-agent"
version = "1.0.0"
description = "DocuVoice LiveKit Voice Agent"
python = "^3.12"

[tool.poetry.dependencies]
python = "^3.12"
livekit-agents = "^1.0.0"
livekit-plugins-aws = {extras = ["realtime"], version = "^1.2.0"}
boto3 = "^1.36.0"
aioboto3 = "^13.0.0"
tiktoken = "^0.8.0"
structlog = "^24.0.0"
pydantic = "^2.10.0"
python-dotenv = "^1.0.0"
```

### Environment Variables (.env)
```bash
# LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1

# S3 + DynamoDB (shared with backend)
S3_BUCKET_NAME=docuvoice-uploads
DYNAMODB_TABLE_NAME=docuvoice-main

# Nova Sonic 2
NOVA_SONIC_MODEL=amazon.nova-2-sonic-v1:0
NOVA_SONIC_VOICE=tiffany
NOVA_SONIC_TURN_DETECTION=MEDIUM

# Nova Lite 2 (for extraction fallback)
NOVA_LITE_MODEL=amazon.nova-2-lite-v1:0
```

---

## MODULE DEPENDENCY MAP

```
                    ┌─────────────────┐
                    │    Frontend      │
                    │   (Next.js 16)   │
                    └────┬──────┬─────┘
                         │      │
              API calls  │      │  WebSocket
                         ▼      ▼
                    ┌─────────────────┐      LiveKit
                    │    Backend      │      Token
                    │   (FastAPI)     │◄─────────────┐
                    └──┬──┬──┬──┬────┘               │
                       │  │  │  │                    │
            ┌──────────┘  │  │  └──────────┐         │
            ▼             │  │             ▼         │
     ┌──────────┐        │  │      ┌──────────┐     │
     │ DynamoDB │        │  │      │ Textract │     │
     │ (repos)  │        │  │      │ (process)│     │
     └──────────┘        │  │      └──────────┘     │
                         │  │                        │
              ┌──────────┘  └──────────┐             │
              ▼                        ▼             │
       ┌──────────┐            ┌──────────┐          │
       │    S3    │            │  Bedrock │          │
       │ (docs)  │            │(Nova Lite)│          │
       └─────┬────┘            └──────────┘          │
             │                                       │
             │  Shared bucket                        │
             │                                       │
             ▼                                       │
     ┌───────────────┐     ┌──────────────────┐     │
     │   Agent       │     │  LiveKit Cloud    │     │
     │ (LiveKit SDK) │◄───►│  (WebRTC + SIP)  │◄────┘
     └──┬──┬──┬──────┘     └──────────────────┘
        │  │  │
        │  │  └─── Nova Sonic 2 (Bedrock Realtime)
        │  └────── DynamoDB (sessions, findings)
        └───────── S3 (workspace context)
```

### Key Boundaries:
1. **Frontend ↔ Backend**: REST API (axios) + WebSocket (real-time updates)
2. **Frontend → LiveKit**: Direct WebRTC connection (via token from backend)
3. **Backend → AWS**: boto3/aioboto3 (S3, DynamoDB, Textract, Bedrock Lite)
4. **Agent → AWS**: boto3 (S3, DynamoDB) + LiveKit Plugin (Nova Sonic 2)
5. **Agent ↔ LiveKit Cloud**: Agent SDK (registered worker, receives dispatches)
6. **Backend ↔ Agent**: Indirect via shared DynamoDB + S3 (no direct communication)

---

## API ENDPOINTS (Backend)

### Authentication
All endpoints require `Authorization: Bearer <jwt>` header.
Clerk JWT verified via JWKS endpoint.

### Workspaces
```
POST   /api/v1/workspaces                    → Create workspace
GET    /api/v1/workspaces                    → List workspaces (paginated)
GET    /api/v1/workspaces/{id}               → Get workspace detail
PUT    /api/v1/workspaces/{id}               → Update workspace config
DELETE /api/v1/workspaces/{id}               → Delete workspace + all data
```

### Documents
```
POST   /api/v1/workspaces/{id}/documents/presigned-url   → Get S3 presigned upload URL
POST   /api/v1/workspaces/{id}/documents/register        → Register uploaded doc metadata
GET    /api/v1/workspaces/{id}/documents                  → List documents
GET    /api/v1/workspaces/{id}/documents/{docId}          → Get document detail + fields
DELETE /api/v1/workspaces/{id}/documents/{docId}          → Delete document
POST   /api/v1/workspaces/{id}/documents/{docId}/reprocess → Re-run processing pipeline
GET    /api/v1/workspaces/{id}/documents/{docId}/status    → Processing status (polling)
```

### Sessions
```
GET    /api/v1/workspaces/{id}/sessions                   → List sessions (paginated)
GET    /api/v1/workspaces/{id}/sessions/{sessId}          → Session detail + transcript
GET    /api/v1/workspaces/{id}/sessions/{sessId}/findings → Session findings
```

### Tokens
```
POST   /api/v1/workspaces/{id}/token          → Generate LiveKit participant token
```

### Plugins
```
GET    /api/v1/plugins/domains                 → List available domain plugins
GET    /api/v1/plugins/sources                 → List available source plugins
GET    /api/v1/plugins/actions                 → List available action plugins
```

### WebSocket
```
WS     /api/v1/ws/{workspaceId}               → Real-time updates
         Events:
         - document.processing_started
         - document.processing_complete
         - document.processing_failed
         - finding.new
         - session.started
         - session.ended
```

### Health
```
GET    /api/v1/health                          → Health check + dependency status
```

---

## DEPLOYMENT CONFIGURATION

### Local Development
```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: ./backend/.env
    volumes: ["./backend:/app"]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  agent:
    build: ./agent
    env_file: ./agent/.env
    volumes: ["./agent:/app"]
    command: python -m agent.entrypoint dev

  # Frontend runs via: cd frontend && npm run dev (port 3000)
```

### Production
```
Frontend:   Vercel (auto-deploy from GitHub, free tier)
Backend:    AWS App Runner (auto-scale to zero, ~$0 idle)
Agent:      LiveKit Cloud hosted worker (lk agent create)
Database:   DynamoDB (on-demand, free tier)
Storage:    S3 (standard, ~pennies)
Processing: Lambda (Textract trigger, free tier)
Auth:       Clerk (free 10K MAU) → Cognito (production)
```

---

## DynamoDB SINGLE-TABLE DESIGN (Recap)

```
Table: docuvoice-main

PK                      SK                    Attributes
────────────────────────────────────────────────────────────────
TENANT#<tid>            PROFILE               name, email, plan, created_at
TENANT#<tid>            WS#<wsid>             name, domain_plugin, sources[], actions[],
                                              phone_number, status, doc_count, created_at
WS#<wsid>               DOC#<docid>           filename, doc_type, s3_key, extracted_fields{},
                                              size_tokens, status, processing_error, created_at
WS#<wsid>               SESSION#<sessid>      channel, caller_id, started_at, ended_at,
                                              duration, transcript_s3, finding_count
SESSION#<sessid>        FINDING#<idx>         type, title, description, doc_refs[],
                                              severity, confidence, created_at
WS#<wsid>               PLUGIN#<name>         credentials_encrypted, settings{}, status

GSI-1 (Phone Lookup):
PK: PHONE#<number>      SK: WS#<wsid>         → O(1) inbound SIP routing

GSI-2 (Session Time):
PK: WS#<wsid>           SK: TIME#<iso>        → List sessions chronologically
```

---

## DOCUMENT PROCESSING PIPELINE (Detail)

```python
# backend/app/processing/pipeline.py

async def process_document(workspace_id: str, doc_id: str, s3_key: str):
    """
    Full pipeline: Upload → Textract → Schema Map → Context Build
    
    1. Textract AnalyzeDocument (TABLES, FORMS, LAYOUT)
    2. Parse Textract response → structured blocks
    3. Classify document type (from domain plugin schemas)
    4. Apply extraction rules (textract_kv, textract_table, regex, llm)
    5. Post-process fields (currency, date, number normalization)
    6. Flatten to processed text (for context window injection)
    7. Store: S3 (processed.json, processed_text.txt) + DynamoDB (fields, status)
    8. Rebuild workspace context (merge all docs)
    """
```

### Processing Modules

| Module | Input | Output | AWS Service |
|--------|-------|--------|-------------|
| `textract_parser.py` | S3 PDF key | Blocks, Tables, KV Pairs, Layout | Textract |
| `schema_mapper.py` | Textract blocks + domain schemas | Extracted fields dict | None (pure logic) |
| `field_post_processors.py` | Raw field values | Normalized values | None |
| `context_builder.py` | All processed docs | Single context string | S3 (store) |

### Context Builder Output Format
```text
=== WORKSPACE: Insurance Claims — AUT-2024-789 ===
Domain: insurance_claims
Documents: 4
Total tokens: 12,450

=== DOCUMENT 1: FNOL-2024-1234.pdf ===
Type: first_notice_of_loss
--- Extracted Fields ---
date_of_loss: 2024-03-16
claimant_name: John Smith
passengers: 2
injury_type: soft tissue
description: Rear-end collision at intersection of Main St and 5th Ave

--- Full Content ---
[Full Textract-extracted text with table preservation...]

=== DOCUMENT 2: Policy-AUT-789.pdf ===
Type: insurance_policy
--- Extracted Fields ---
policy_number: AUT-2024-789
bi_limit_per_person: $100,000
bi_limit_per_occurrence: $300,000
pd_limit: $50,000
deductible: $500
effective_date: 2024-01-01
expiry_date: 2025-01-01

--- Full Content ---
[Full policy text...]

[... remaining documents ...]
```

---

## AGENT ENTRYPOINT (Detail)

```python
# agent/agent/entrypoint.py

from livekit.agents import AgentSession, JobContext, function_tool, cli
from livekit.plugins.aws.experimental.realtime import RealtimeModel

from .plugins.registry import PluginRegistry
from .context.builder import load_workspace_context
from .context.injector import inject_context

registry = PluginRegistry()

async def entrypoint(ctx: JobContext):
    # 1. Resolve workspace from room metadata or SIP headers
    workspace = await resolve_workspace(ctx)
    
    # 2. Load and resolve plugins
    plugins = registry.resolve_workspace(workspace.config)
    
    # 3. Build system prompt (domain + guardrails)
    system_prompt = registry.build_system_prompt(plugins, workspace)
    
    # 4. Merge function tools (domain tools + action tools)
    tools = registry.build_function_tools(plugins)
    
    # 5. Load document context from S3
    context_text = await load_workspace_context(workspace.id)
    
    # 6. Create Nova Sonic 2 model
    model = RealtimeModel.with_nova_sonic_2(
        voice="tiffany",
        turn_detection="MEDIUM",
        max_tokens=10_000,
    )
    
    # 7. Create agent session
    agent = AgentSession(llm=model)
    
    # 8. Register all function tools
    for tool in tools:
        agent.register_tool(tool)
    
    # 9. Set system instructions
    agent.update_instructions(system_prompt)
    
    # 10. Inject document context via cross-modal text
    await agent.generate_reply(
        instructions=f"DOCUMENT CONTEXT:\n{context_text}",
        user_input="Documents loaded. Greet the user and ask how you can help."
    )
    
    # 11. Connect to room
    await agent.start(ctx.room)

if __name__ == "__main__":
    cli.run_app(entrypoint)
```

---

## KEY DESIGN DECISIONS SUMMARY

| Decision | Choice | Why |
|----------|--------|-----|
| Monorepo | Yes (3 packages) | Shared types, single deploy pipeline |
| Frontend framework | Next.js 16 (App Router) | SSR tokens, API routes as BFF, Vercel deploy |
| UI components | shadcn/ui + LiveKit Agents UI | Production-quality, customizable, Tailwind v4 |
| State management | Zustand | Minimal, 3 stores, React 19 compatible |
| Auth | Clerk (hackathon) → Cognito (prod) | Speed vs AWS-native |
| Backend framework | FastAPI | Async, Pydantic v2, you know it |
| Database | DynamoDB single-table | $0 idle, scales infinitely, perfect for this access pattern |
| File storage | S3 + presigned URLs | Files never touch backend server |
| Doc processing | Textract + custom pipeline | Tables + forms + KV extraction |
| Voice model | Nova Sonic 2 via LiveKit plugin | 1M context, async tools, speech-to-speech |
| Text LLM | Nova Lite 2 (extraction) | Cheap, fast, good enough for field extraction |
| Agent framework | LiveKit Agents SDK v1.x | You know it, production-ready, SIP support |
| Agent hosting | LiveKit Cloud | Free tier, auto-scale, zero ops |
| Backend hosting | AWS App Runner | $0 idle, auto-scale, Docker deploy |
| Frontend hosting | Vercel | Free, auto-deploy, edge network |