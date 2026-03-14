# DocuVoice — Frontend UX Design & Task Plan

## 1. UI DIRECTION: "Command Center" (NOT a Chatbot Dashboard)

### What We're NOT Building
- ❌ Vapi/Retell style = developer dashboard (API keys, webhook logs, phone number config)
- ❌ ChatGPT style = simple chat window
- ❌ NotebookLM style = content consumption/podcast
- ❌ Generic SaaS dashboard with charts

### What We ARE Building
**A document workspace where voice is the primary interface**

Think: **Linear (clean, fast, keyboard-driven) meets Notion (workspaces, documents) meets Apple's Siri orb (voice as centerpiece)**

### Design Philosophy
1. **Voice orb is the hero** — big, centered, always accessible. Not a tiny button in the corner.
2. **Documents surround the conversation** — as you talk, relevant documents highlight, extracted fields appear in real-time
3. **Findings surface live** — when the agent finds a discrepancy or flags something, it appears visually
4. **Dark mode default** — professionals working long hours, premium feel, makes the voice orb glow pop
5. **Minimal clicks** — upload docs, click the orb, start talking. That's it.

### Visual Reference
- **Linear** — clean sidebar nav, minimal chrome, fast interactions
- **Raycast** — command palette feel, dark mode, keyboard-first
- **Arc Browser** — split panels, modern, playful but professional
- **Apple Intelligence** — the glowing orb animation for voice state

---

## 2. PAGE STRUCTURE (7 Pages Total)

### P1. Landing Page (Marketing)
- Hero: "Talk to Your Documents. From Any Phone."
- Live demo widget (embedded voice agent with sample docs)
- 3 use case cards (Insurance, Legal, Finance)
- Pricing section
- CTA: Sign up free

### P2. Dashboard (Home)
- List of workspaces (cards with doc count, last call, status)
- Quick stats: total calls, total docs, minutes used
- "Create Workspace" prominent CTA
- Recent sessions timeline

### P3. Workspace Setup (Onboarding Wizard)
- Step 1: Choose domain template (Insurance Claims, Legal, Financial, Custom)
- Step 2: Upload documents (drag & drop zone, S3 presigned upload)
- Step 3: Configure plugins (optional — source connectors, action connectors)
- Step 4: Review & activate (shows extracted fields preview, assigned phone number)

### P4. Workspace View (THE MAIN PAGE — where users spend 90% of time)
```
+--------+------------------------------------------+----------------+
|        |                                          |                |
| SIDE   |           VOICE AGENT AREA               |   DOCUMENT     |
| BAR    |                                          |   PANEL        |
|        |     +------------------------+           |                |
| - Docs |     |                        |           | - Doc list     |
| - Calls|     |    VOICE ORB           |           | - Extracted    |
| - Find |     |    (glow animation)    |           |   fields       |
| - Tools|     |                        |           | - Highlights   |
| - Set  |     +------------------------+           |                |
|        |                                          |                |
|        |     LIVE TRANSCRIPT                      |   FINDINGS     |
|        |     (scrolling, timestamped)             |   (cards that  |
|        |                                          |    appear as   |
|        |     SUGGESTED QUESTIONS                  |    agent finds)|
|        |     [What's the BI limit?]               |                |
|        |     [Any discrepancies?]                 |                |
|        |     [Calculate exposure]                 |                |
|        |                                          |                |
+--------+------------------------------------------+----------------+
```

### P5. Session History
- List of all calls (date, duration, channel, findings count)
- Click to see full transcript + findings
- Export as PDF / adjuster notes

### P6. Settings
- Workspace config (domain plugin, voice, turn detection)
- Phone number management
- Plugin connections (OAuth flows for Google Drive, Slack, etc.)
- Team members & roles

### P7. Admin (if multi-tenant)
- Tenant management
- Usage analytics
- Billing

---

## 3. THE WORKSPACE VIEW — Detailed UX Design

This is the money page. Let's design every state.

### 3A. Voice Orb States
```
IDLE:        Subtle breathing animation (gentle pulse, muted glow)
             Text: "Click to start talking" or press Space
             
CONNECTING:  Orb expands slightly, faster pulse
             Text: "Connecting..."
             
LISTENING:   Bright glow, audio waveform ripple effect
             Text: "Listening..." + live transcription preview
             
SPEAKING:    Different color glow (e.g., blue), waveform matches agent speech
             Text: Agent's response appears in transcript
             
THINKING:    Rotating/spinning subtle animation
             Text: "Analyzing documents..." (during tool calls)
             
TOOL_CALL:   Orb splits into smaller orbs briefly (visual for async tool execution)
             Text: "Running compare_coverage()..."
             Finding card animates into the findings panel
             
ERROR:       Red pulse, then back to idle
             Text: "Connection lost. Click to reconnect."
             
PHONE_ACTIVE: Phone icon overlay on orb
              Text: "Phone call active — Session shared"
```

### 3B. Document Panel (Right Side)
```
+--------------------------------+
| DOCUMENTS (4)            [+ Add]|
|--------------------------------|
| 📄 FNOL-2024-1234.pdf    ✅   |
|    Type: First Notice of Loss   |
|    3 fields extracted           |
|                                 |
| 📄 Policy-AUT-789.pdf    ✅   |
|    Type: Insurance Policy       |
|    8 fields extracted           |
|    ⚡ Currently referenced      | ← highlights when agent cites it
|                                 |
| 📄 Medical-Bills.pdf      ✅   |
|    Type: Medical Bill           |
|    5 fields extracted           |
|                                 |
| 📄 Police-Report.pdf      ✅   |
|    Type: Police Report          |
|    4 fields extracted           |
+--------------------------------+
| EXTRACTED FIELDS          [All] |
|--------------------------------|
| Policy # : AUT-2024-789       |
| BI Limit : $100,000           |
| PD Limit : $50,000            |
| Deductible: $500              |
| Date of Loss: 2024-03-15     |
| Total Medical: $23,450        | ← red if exceeds policy limit
| ...                            |
+--------------------------------+
| FINDINGS (2)               🔴  |
|--------------------------------|
| ⚠️ Discrepancy Found          |
| FNOL says 2 passengers,        |
| Police report says 3            |
| Confidence: High                |
|                                 |
| 💰 Exposure Alert              |
| Medical ($23,450) approaches    |
| BI limit ($100,000) at 23%     |
+--------------------------------+
```

### 3C. Transcript Area (Center, below orb)
```
+------------------------------------------+
| 🔴 LIVE  |  00:02:34  |  Web Session     |
|------------------------------------------|
| 🤖 Agent (0:00)                          |
| Hello! I've loaded 4 documents for       |
| claim AUT-2024-789. I can see the FNOL,  |
| policy, medical bills, and police report.|
| What would you like to know?             |
|                                          |
| 👤 You (0:15)                            |
| What are the policy limits for bodily    |
| injury?                                  |
|                                          |
| 🤖 Agent (0:18)                          |
| The bodily injury limit on policy        |
| AUT-2024-789 is $100,000 per person      |
| and $300,000 per occurrence. The          |
| deductible is $500.                      |
| [📄 Policy-AUT-789.pdf referenced]       |
|                                          |
| 👤 You (0:35)                            |
| Are there any discrepancies between      |
| the FNOL and the police report?          |
|                                          |
| 🤖 Agent (0:38)                          |
| Let me compare those documents...        |
| [⚙️ Running compare_fields()]            |
|                                          |
| 🤖 Agent (0:41)                          |
| Yes, I found a discrepancy. The FNOL     |
| lists 2 passengers, but the police       |
| report lists 3 passengers. This should   |
| be investigated.                         |
| [⚠️ Finding: Passenger count mismatch]   |
+------------------------------------------+
| SUGGESTED QUESTIONS                       |
| [Calculate my exposure on this claim]     |
| [Summarize for adjuster notes]            |
| [Flag any red flags]                      |
+------------------------------------------+
```

---

## 4. UX MICRO-INTERACTIONS

### Document Upload
1. Drag file onto workspace → drop zone animates
2. Upload progress bar (presigned URL, direct to S3)
3. "Processing..." with Textract animation (scanning visual)
4. Fields appear one by one as they're extracted (staggered animation)
5. Document card turns green ✅ when ready

### Voice Connection
1. Click orb (or press Space) → orb expands with ripple
2. Browser mic permission (if first time)
3. LiveKit room join → "Connected" flash
4. Agent greeting plays → transcript starts populating

### Finding Discovery
1. Agent calls tool → "Analyzing..." spinner on orb
2. Tool returns result → finding card slides in from right
3. Red/yellow/blue glow based on severity
4. Related document briefly highlights in doc panel
5. Extracted field that triggered finding gets underlined

### Phone Call Active
1. When someone calls the workspace phone number while web is open
2. Banner at top: "📞 Phone call active — you and the caller share this session"
3. Phone caller's audio appears in transcript alongside web user

---

## 5. COMPONENT LIBRARY (shadcn/ui + LiveKit Agents UI)

### From shadcn/ui
- Button, Card, Dialog, Dropdown, Input, Label
- Tabs, Table, Badge, Alert, Progress
- Sheet (sliding panels), Skeleton (loading states)
- Command (keyboard shortcuts palette)

### From LiveKit Agents UI
- AgentSessionProvider
- AgentControlBar (mic toggle, end call)
- AgentChatTranscript (live transcript)
- AgentAudioVisualizerBar (waveform)
- StartAudioButton

### Custom Components to Build
- VoiceOrb (hero component with state animations)
- DocumentCard (upload state, processing, ready, referenced)
- FindingCard (severity-colored, expandable)
- ExtractedFieldsList (key-value with source doc reference)
- WorkspaceTemplate selector (onboarding wizard)
- PhoneCallBanner (active call indicator)
- SuggestedQuestions (contextual prompts)

---

## 6. TASK PLAN — Frontend Development

### Phase 1: Foundation (Days 1-2)
```
Task                                          Priority  Est.
─────────────────────────────────────────────────────────────
F1.1  Next.js 15 project setup                P0       2h
      - App Router, Tailwind v4, shadcn/ui
      - LiveKit Agents UI registry
      - Environment config (LK, AWS)
      
F1.2  Auth setup (Clerk or Cognito)           P0       3h
      - Sign up / sign in pages
      - Protected routes middleware
      - JWT token for API calls
      
F1.3  Layout shell                            P0       3h
      - Sidebar navigation
      - Dark mode theme
      - Responsive breakpoints
      - Command palette (Cmd+K)

F1.4  API client setup                        P0       2h
      - Axios/fetch wrapper for FastAPI
      - LiveKit token generation via API route
      - S3 presigned URL helper
```

### Phase 2: Core Workspace (Days 3-5)
```
Task                                          Priority  Est.
─────────────────────────────────────────────────────────────
F2.1  Dashboard page                          P0       4h
      - Workspace list (cards)
      - Quick stats
      - Create workspace button
      
F2.2  Workspace creation wizard               P0       6h
      - Template selector (4 domain options)
      - Document upload (drag & drop → S3 presigned)
      - Processing status (WebSocket or polling)
      - Plugin config (optional)
      - Review & activate
      
F2.3  VoiceOrb component                      P0       6h
      - All 7 states with CSS animations
      - Glowing pulse (idle), waveform (listening/speaking)
      - Tool call visual (thinking state)
      - Keyboard shortcut (Space to toggle)
      - THIS IS THE HERO — spend time making it beautiful
      
F2.4  Workspace main view — layout            P0       4h
      - 3-panel layout (sidebar, center, document panel)
      - Responsive (collapses panels on mobile)
      - Panel resize handles
```

### Phase 3: Voice Integration (Days 5-7)
```
Task                                          Priority  Est.
─────────────────────────────────────────────────────────────
F3.1  LiveKit room connection                 P0       4h
      - Token generation (Next.js API route → livekit-api)
      - LiveKitRoom component wrapper
      - Connection state management
      - Auto-reconnect on disconnect
      
F3.2  Live transcript                         P0       4h
      - AgentChatTranscript integration
      - Timestamped messages
      - Agent vs User visual distinction
      - Auto-scroll to bottom
      - Document references inline
      
F3.3  Audio visualizer                        P0       3h
      - AgentAudioVisualizerBar around the VoiceOrb
      - Match orb state to agent state
      - Smooth transitions between states
      
F3.4  Suggested questions                     P1       2h
      - Domain-specific prompts
      - Click to send as text input
      - Context-aware (change based on conversation)
```

### Phase 4: Document Panel (Days 7-9)
```
Task                                          Priority  Est.
─────────────────────────────────────────────────────────────
F4.1  Document list component                 P0       3h
      - Upload status indicators
      - Document type badges
      - "Currently referenced" highlight
      - Click to expand/preview
      
F4.2  Extracted fields display                P0       3h
      - Key-value list from DynamoDB
      - Color-code anomalies (red if exceeds limits)
      - Source document reference
      - Copy field value
      
F4.3  Findings panel                          P0       4h
      - Real-time finding cards (animate in)
      - Severity colors (red/yellow/blue)
      - Expandable details
      - Link to source document + field
      
F4.4  Document upload (in-workspace)          P1       3h
      - Add more docs to existing workspace
      - Re-process with updated schema
      - Delete document
```

### Phase 5: Session History & Polish (Days 9-11)
```
Task                                          Priority  Est.
─────────────────────────────────────────────────────────────
F5.1  Session history page                    P1       4h
      - List of all calls (sortable, filterable)
      - Duration, channel, findings count
      - Click for full transcript replay
      
F5.2  Session detail view                     P1       3h
      - Full transcript with timestamps
      - Findings summary
      - Export as PDF / markdown
      
F5.3  Settings page                           P1       3h
      - Workspace config (voice, turn detection)
      - Plugin connections (OAuth redirects)
      - Phone number display
      
F5.4  Phone call banner                       P2       2h
      - Active call indicator
      - Session sharing visual
      
F5.5  Polish & animations                     P1       4h
      - Page transitions
      - Loading skeletons
      - Error states
      - Empty states (no docs, no calls)
      - Confetti on first successful call? 😄
```

### Phase 6: Landing Page (Days 11-12)
```
Task                                          Priority  Est.
─────────────────────────────────────────────────────────────
F6.1  Marketing landing page                  P1       6h
      - Hero with embedded demo widget
      - Use case cards
      - Architecture diagram
      - Pricing table
      - CTA sections
      
F6.2  Embedded widget (for external sites)    P2       4h
      - Standalone voice widget component
      - iframe embed code generator
      - Customizable theme
```

---

## 7. TASK PLAN — Backend (FastAPI)

### Phase 1: Foundation (Days 1-2)
```
Task                                          Priority  Est.
─────────────────────────────────────────────────────────────
B1.1  FastAPI project setup                   P0       2h
      - Project structure, poetry/uv
      - Config management (pydantic-settings)
      - CORS, error handling middleware
      - Health check endpoint
      
B1.2  DynamoDB setup                          P0       3h
      - Table creation (IaC or boto3 script)
      - Data access layer (repository pattern)
      - Pydantic models for all entities
      
B1.3  S3 setup                                P0       2h
      - Bucket creation with CORS
      - Presigned URL generation endpoint
      - File organization helpers
      
B1.4  Auth middleware                          P0       3h
      - Cognito/Clerk JWT verification
      - Tenant extraction from token
      - Permission checks (workspace access)
```

### Phase 2: Core API (Days 3-5)
```
Task                                          Priority  Est.
─────────────────────────────────────────────────────────────
B2.1  Workspace CRUD                          P0       4h
      - POST/GET/PUT/DELETE /workspaces
      - Plugin config validation
      - Phone number assignment (LiveKit API)
      
B2.2  Document management                     P0       4h
      - Presigned URL generation
      - Document metadata CRUD
      - Document type classification
      - Processing status endpoint
      
B2.3  Document processing pipeline            P0       8h
      - S3 upload trigger (Lambda or background task)
      - Textract integration
      - Schema mapper implementation
      - Context builder (flattened text)
      - Workspace context rebuild
      
B2.4  LiveKit token generation                P0       2h
      - Participant token with workspace metadata
      - Room name = workspace_id
      - Grants configuration
```

### Phase 3: Agent (Days 5-8)
```
Task                                          Priority  Est.
─────────────────────────────────────────────────────────────
B3.1  LiveKit Agent base                      P0       4h
      - Agent entrypoint
      - Workspace resolution (room metadata + SIP)
      - Nova Sonic 2 session setup
      
B3.2  Plugin framework                        P0       6h
      - DomainPlugin ABC
      - SourcePlugin ABC
      - ActionPlugin ABC
      - PluginRegistry
      
B3.3  Insurance Claims plugin                 P0       4h
      - 4 document schemas
      - 6 extraction rules
      - 4 function tools
      - 3 guardrails
      - System prompt
      
B3.4  Context injection                       P0       4h
      - Load processed docs from S3
      - Build workspace context text
      - Cross-modal text injection
      - Session continuity (DynamoDB lookup)
      
B3.5  Session persistence                     P1       3h
      - Transcript storage
      - Finding persistence (real-time)
      - Session end summary
```

### Phase 4: Integration & Polish (Days 8-10)
```
Task                                          Priority  Est.
─────────────────────────────────────────────────────────────
B4.1  WebSocket for real-time updates         P1       4h
      - Document processing status
      - Finding notifications
      - Session state updates
      
B4.2  Session history API                     P1       3h
      - List sessions with pagination
      - Session detail with transcript
      - Findings aggregation
      
B4.3  Export endpoints                        P2       3h
      - Export findings as PDF
      - Export adjuster notes (markdown)
      - Export session transcript
```

---

## 8. TIMELINE SUMMARY

```
WEEK 1 (Days 1-5):     Foundation + Core
                        BE: FastAPI + DynamoDB + S3 + Doc Processing
                        FE: Next.js + Auth + Dashboard + Workspace Wizard
                        
WEEK 2 (Days 5-10):    Voice + Documents + Agent
                        BE: LiveKit Agent + Plugin Framework + Insurance Plugin
                        FE: VoiceOrb + LiveKit Integration + Document Panel + Findings
                        
WEEK 3 (Days 10-14):   Polish + Demo
                        BE: Session history + WebSocket + Export
                        FE: Session history + Settings + Landing page + Polish
                        
Day 15:                 Record 3-minute demo video
Day 16:                 Write Devpost submission
Day 17 (March 17):     SUBMIT
```

---

## 9. HACKATHON MVP vs FULL PRODUCT

| Feature                    | Hackathon MVP              | Full Product         |
|---------------------------|---------------------------|----------------------|
| Domain plugins            | Insurance only             | 4+ verticals         |
| Source connectors         | Upload only                | Google Drive, SP, etc|
| Action connectors         | None (or Slack webhook)    | Jira, Email, SF, etc |
| Auth                      | Clerk (5 min setup)        | Cognito + RBAC       |
| Voice channels            | Web + 1 phone number       | Multi-number + SIP   |
| Session history           | Basic list                 | Full analytics       |
| Landing page              | Simple hero + demo         | Full marketing site  |
| Multi-tenant              | Single user                | Teams + orgs         |
| Embedded widget           | Skip                       | iframe + npm package |
| Export                    | Skip                       | PDF, markdown, JSON  |

Focus the hackathon on: **VoiceOrb + Document Upload + Live Conversation + Findings = WOW demo**

Everything else is nice-to-have.