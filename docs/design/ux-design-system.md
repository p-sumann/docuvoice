# DocuVoice — UX Design Direction & Design System

## The UX DNA Recipe

**DocuVoice = Linear (shell) + Clerk (auth) + Notion (workspace UX) + Vercel v0 (polish) + ElevenLabs (voice orb) + Stripe Dashboard (data density)**

---

## 1. What to Steal from Each Product

### 🏗️ Shell & Navigation → Linear
Linear's dark mode isn't just "dark" — it's a carefully layered elevation system using dark grays (`#0a0b0f`, `#0d0e14`, `#131620`), not pure black. Their sidebar is 48px thin with icon-only nav, their topbar is barely there, and the content area gets 85%+ of screen real estate. Their keyboard shortcuts (Cmd+K command palette) make power users fast.

**What we steal:**
- The sidebar style (thin, icon-only, expandable)
- The color system (layered dark grays, not pure black)
- The elevation layers (surfaces at different depths)
- The "content is king" philosophy (minimal chrome)
- The command palette (Cmd+K for global search/actions)
- The LCH-based theme generation system

### 🔐 Auth & Onboarding → Clerk
Clerk's sign-in/sign-up is the best React auth UI — polished, animated, social logins, dark mode native. We don't redesign auth. We use Clerk components with our brand colors.

**What we steal:**
- Pre-built sign-in/sign-up UI (zero custom auth work)
- Social login buttons (Google, GitHub)
- The smooth animated transitions between auth states
- Organization/workspace switching (built into Clerk)
- Dark mode theming that matches our shell

### 📂 Workspace & Document Management → Notion
Notion nails the "workspace as a container for everything" concept. The sidebar shows workspaces, each workspace has pages (our documents), and the main area is a canvas.

**What we steal:**
- Workspace switching (sidebar dropdown)
- Document list as a sidebar section
- Empty state designs (delightful, encouraging, not blank)
- The way new workspaces feel like a fresh start
- Breadcrumb navigation (Dashboard > Workspace > Session)
- The template selector (we use it for domain plugin selection)

### ✨ Visual Polish & Micro-interactions → Vercel / v0.dev
Vercel's dashboard has the best micro-interactions in SaaS — deployment status animations, subtle hover states, skeleton loaders that feel intentional, toast notifications that don't annoy. Their typography uses Geist (the successor to Inter for dark mode).

**What we steal:**
- Loading states (skeleton loaders with shimmer)
- Toast notification system (bottom-right, auto-dismiss)
- Hover cards with extra detail (hover a doc → see fields preview)
- The Geist font family (sharp in dark mode, readable at small sizes)
- The feeling that every pixel was considered
- Status badges (processing → ready → error) with smooth transitions

### 🎙️ Voice Interface → ElevenLabs
ElevenLabs' voice lab has the best voice visualization in a web app — waveform that morphs between speaking/listening states, a glowing orb that breathes, and the transcript appears with character-level streaming.

**What we steal:**
- The orb animation style (breathing pulse when idle, active waveform when speaking)
- The waveform visualization (bars that respond to audio amplitude)
- Character-level transcript streaming (text appears as it's spoken)
- The way voice feels like an experience, not a configuration panel
- Audio visualizer that's beautiful enough to be the centerpiece
- The transition between voice states (smooth, not jarring)

### 📊 Data Density → Stripe Dashboard
When we show extracted fields, findings, and session history — we need information density without clutter. Stripe's dashboard is the gold standard.

**What we steal:**
- Key-value pair layout (label left, value right, monospace for data)
- Severity/status badges (small, color-coded, pill-shaped)
- Expandable rows (click finding → see full detail inline)
- Subtle dividers instead of heavy borders
- The way they handle lists (compact but scannable)
- Time-based event lists (our session history)
- The "click to copy" pattern for field values

---

## 2. What NOT to Copy

| Product | Why Not |
|---------|---------|
| **Vapi** | Developer dashboard aesthetic. Config panels, JSON viewers, webhook logs. Our users are adjusters, not devs. |
| **Retell** | Same problem. Clean but developer-centric. Phone number management UI ≠ our core experience. |
| **ChatGPT** | Full-width chat layout wastes screen space. No side panels. Voice is a tiny icon, not the hero. |
| **NotebookLM** | "Podcast player" metaphor doesn't fit real-time conversation. Pre-generated ≠ interactive. |
| **Slack/Teams** | Messaging-first. Voice is an afterthought. We're the opposite — voice-first, text supports it. |
| **Generic SaaS** | Charts and graphs on the dashboard. We don't need vanity metrics. Workspaces and recent calls are what matter. |

---

## 3. Design System Specification

### Font Stack
```css
--font-display: 'Geist', system-ui, -apple-system, sans-serif;
--font-body: 'Geist', system-ui, -apple-system, sans-serif;
--font-mono: 'Geist Mono', 'JetBrains Mono', monospace;
```

**Usage:**
- Display (Geist 700): Page titles, workspace names, voice orb labels
- Body (Geist 400/500): Paragraph text, descriptions, transcript
- Mono (Geist Mono 400): Extracted field values, timestamps, policy numbers, monetary amounts

### Color System (Linear-Inspired Layered Elevation)

#### Backgrounds (Layered Depth)
```css
--bg-base:      #0a0b0f;   /* Deepest background (page) */
--bg-surface:   #0d0e14;   /* Sidebar, panels, cards */
--bg-elevated:  #131620;   /* Dropdowns, modals, popovers */
--bg-hover:     #1a1d2a;   /* Hover states on interactive elements */
--bg-active:    #222640;   /* Active/selected states */
```

#### Borders
```css
--border-subtle:  #1e2230;   /* Default borders (barely visible) */
--border-default: #2a2f42;   /* Visible borders (panels, dividers) */
--border-strong:  #3d4460;   /* Emphasized borders (focused inputs) */
```

#### Text
```css
--text-primary:    #e2e8f0;   /* Main text (headings, body) */
--text-secondary:  #94a3b8;   /* Supporting text (labels, descriptions) */
--text-muted:      #475569;   /* Disabled, placeholder, hint text */
--text-inverse:    #0a0b0f;   /* Text on light/accent backgrounds */
```

#### Accent Colors (Desaturated for Dark Mode)
```css
/* Primary */
--accent-blue:     #3b82f6;   /* Primary actions, links, active states */
--accent-blue-dim: #1e40af;   /* Blue backgrounds (badges, banners) */

/* Voice States */
--accent-purple:   #8b5cf6;   /* Voice orb glow, AI actions, thinking state */
--accent-emerald:  #10b981;   /* Listening state, success, doc ready */
--accent-cyan:     #06b6d4;   /* Speaking state, info */

/* Semantic */
--accent-amber:    #f59e0b;   /* Warnings, processing, medium severity */
--accent-red:      #ef4444;   /* Errors, high severity findings */
--accent-green:    #22c55e;   /* Success, completion, low severity */
```

#### Voice Orb Gradient Palette
```css
--orb-idle:        linear-gradient(135deg, #334155, #1e293b, #0f172a);
--orb-connecting:  linear-gradient(135deg, #f59e0b, #d97706, #b45309);
--orb-listening:   linear-gradient(135deg, #10b981, #059669, #047857);
--orb-speaking:    linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6);
--orb-thinking:    linear-gradient(135deg, #8b5cf6, #a855f7, #d946ef);
--orb-tool-call:   linear-gradient(135deg, #f59e0b, #ef4444, #ec4899);
--orb-error:       linear-gradient(135deg, #ef4444, #b91c1c, #7f1d1d);
```

### Spacing Scale (8px Base)
```css
--space-1:  4px;    /* Tight gaps (icon + label) */
--space-2:  8px;    /* Default element spacing */
--space-3:  12px;   /* Card padding, small gaps */
--space-4:  16px;   /* Section spacing */
--space-5:  20px;   /* Panel padding */
--space-6:  24px;   /* Large section gaps */
--space-8:  32px;   /* Page-level spacing */
--space-10: 40px;   /* Major section separation */
--space-12: 48px;   /* Page margins */
```

### Border Radius
```css
--radius-sm:  4px;    /* Badges, small pills */
--radius-md:  6px;    /* Buttons, inputs */
--radius-lg:  8px;    /* Cards, panels */
--radius-xl:  12px;   /* Modals, sheets */
--radius-full: 9999px; /* Voice orb, avatars, circular elements */
```

### Shadow System (Subtle, Elevation-Based)
```css
--shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md:  0 4px 12px rgba(0, 0, 0, 0.4);
--shadow-lg:  0 8px 24px rgba(0, 0, 0, 0.5);
--shadow-orb: 0 0 60px rgba(139, 92, 246, 0.3);  /* Voice orb glow */
```

### Animation Tokens
```css
--duration-fast:    150ms;   /* Hover states, toggles */
--duration-normal:  300ms;   /* Panel transitions, fades */
--duration-slow:    500ms;   /* Page transitions, slide-ins */
--duration-orb:     2000ms;  /* Orb breathing cycle */

--ease-default:     cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce:      cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-orb:         cubic-bezier(0.45, 0, 0.55, 1);   /* Smooth orb pulse */
```

---

## 4. Component Source Mapping

### From shadcn/ui (Radix-based) — Already Linear Aesthetic
```
Button          → Primary, Secondary, Ghost, Destructive variants
Card            → Workspace cards, finding cards, doc cards
Dialog          → Confirmation modals, document preview
Dropdown Menu   → Context menus, workspace switcher
Input           → Search, form fields
Badge           → Status pills (ready, processing, error)
Progress        → Document processing bar
Sheet           → Mobile sidebar, slide-over panels
Skeleton        → Loading states (shimmer effect)
Tabs            → Workspace sub-navigation
Table           → Session history, extracted fields
Command         → Cmd+K command palette
Toast           → Notifications (findings, processing complete)
Alert           → Error states, warnings
Tooltip         → Hover hints on icons
Separator       → Subtle dividers between sections
ScrollArea      → Custom scrollbar styling (4px, dark track)
```

### From LiveKit Agents UI — Voice-Specific
```
AgentSessionProvider       → Wraps voice UI, manages session state
AgentControlBar            → Mic toggle, end call, volume
AgentChatTranscript        → Live transcript with streaming text
AgentAudioVisualizerBar    → Waveform visualization
StartAudioButton           → Browser audio permission handler
```

### Custom Components (Our Differentiators)
```
VoiceOrb              → Hero component, 7 states, CSS animations, glow effects
DocumentCard          → Upload → Processing → Ready → Referenced states
FindingCard           → Severity-colored, expandable, animated slide-in
ExtractedFieldsList   → Key-value pairs with anomaly highlighting
WorkspaceWizard       → Multi-step creation (template → upload → config → activate)
TemplateSelectorGrid  → Domain plugin picker with icons and descriptions
PhoneCallBanner       → Active SIP call indicator (top banner)
SuggestedQuestions    → Contextual prompts below transcript
PanelResizer          → Draggable boundary between center and right panels
CommandPalette        → Global Cmd+K with workspace search, doc search, actions
```

---

## 5. Key Screen Layouts

### Dashboard (Home)
```
┌──────────────────────────────────────────────────────┐
│ [DV Logo]  DocuVoice          [Cmd+K] [Settings] [👤]│
├──────────────────────────────────────────────────────┤
│                                                      │
│  Welcome back, Suman                                 │
│                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ 3 Workspaces│ │ 12 Sessions │ │ 47 min used │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                      │
│  Workspaces                          [+ New Workspace]│
│  ┌──────────────────────────────────────────────┐   │
│  │ 📋 Insurance Claims — AUT-2024-789           │   │
│  │    4 docs · Last call 2h ago · 3 findings    │   │
│  ├──────────────────────────────────────────────┤   │
│  │ ⚖️ Legal Review — Contract-Q1-2025           │   │
│  │    2 docs · No calls yet                     │   │
│  ├──────────────────────────────────────────────┤   │
│  │ 💰 Financial DD — Series B Target            │   │
│  │    7 docs · Last call yesterday · 5 findings │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Recent Sessions                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🌐 Web · Insurance Claims · 4m 23s · 3 finds│   │
│  │ 📞 Phone · Insurance Claims · 2m 11s · 1 find│   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Workspace View (Main — 90% of User Time)
```
┌──┬──────────────────────────────────────┬────────────┐
│  │ Insurance Claims — AUT-2024-789  🔴  │ 📞 +1(555)│
│  │ 4 docs loaded · Web Session · 2:34   │   123-4567│
│  ├──────────────────────────────────────┼────────────┤
│📄│                                      │ DOCUMENTS  │
│  │                                      │ ────────── │
│🎙│          ╭──────────────╮            │ 📄 FNOL ✅ │
│  │          │              │            │ 📄 Policy ✅│
│📞│          │  VOICE ORB   │            │   ⚡ Active │
│  │          │  (glowing)   │            │ 📄 Medical✅│
│🔍│          │              │            │ 📄 Police ✅│
│  │          ╰──────────────╯            │            │
│⚙│       Click or press Space           │ FIELDS     │
│  │                                      │ ────────── │
│  │  ─────── TRANSCRIPT ───────          │ Policy#    │
│  │                                      │ AUT-2024-789│
│  │  🤖 Hello! I've loaded 4 docs...    │ BI Limit   │
│  │                                      │ $100,000   │
│  │  👤 What are the BI limits?          │ Deductible │
│  │                                      │ $500       │
│  │  🤖 The BI limit is $100,000        │ ⚠ Passenger│
│  │      per person...                   │ FNOL:2 ≠ 3│
│  │     📄 Policy-AUT-789.pdf           │            │
│  │                                      │ FINDINGS   │
│  │  ─────── SUGGESTIONS ───────         │ ────────── │
│  │  [Calculate exposure]                │ 🔴 Mismatch│
│  │  [Any discrepancies?]                │ 🟡 Exposure│
│  │  [Generate adjuster summary]         │            │
└──┴──────────────────────────────────────┴────────────┘
```

### Workspace Creation Wizard
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Create New Workspace                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                  │
│  Step 1 of 4: Choose Domain                          │
│                                                      │
│  ┌────────────────┐  ┌────────────────┐             │
│  │  📋 Insurance  │  │  ⚖️ Legal      │             │
│  │  Claims        │  │  Contracts     │             │
│  │                │  │                │             │
│  │  FNOL, policy, │  │  NDAs, MSAs,   │             │
│  │  medical bills │  │  amendments    │             │
│  │  police reports│  │  term sheets   │             │
│  │                │  │                │             │
│  │  [SELECTED ✓]  │  │  [Select]      │             │
│  └────────────────┘  └────────────────┘             │
│  ┌────────────────┐  ┌────────────────┐             │
│  │  💰 Financial  │  │  🔧 Custom     │             │
│  │  Due Diligence │  │  Domain        │             │
│  │                │  │                │             │
│  │  Balance sheets│  │  Define your   │             │
│  │  P&L, cap table│  │  own schemas   │             │
│  │  audit reports │  │  and rules     │             │
│  │                │  │                │             │
│  │  [Select]      │  │  [Select]      │             │
│  └────────────────┘  └────────────────┘             │
│                                                      │
│                              [Back]  [Next: Upload →]│
└──────────────────────────────────────────────────────┘
```

---

## 6. Voice Orb — State Design

| State | Gradient | Animation | Inner Icon | Label |
|-------|----------|-----------|------------|-------|
| **Idle** | Slate grays | Slow breathing pulse (3s cycle) | Microphone icon | "Click or press Space" |
| **Connecting** | Amber/orange | Faster pulse (1s) | Pulsing dots | "Connecting..." |
| **Listening** | Emerald/green | Audio-reactive waveform bars | 5 equalizer bars | "Listening..." |
| **Speaking** | Blue/indigo/violet | Smooth waveform bars (7 bars) | 7 equalizer bars | "Speaking..." |
| **Thinking** | Purple/fuchsia/pink | Slow rotation (2s spin) | Spinner icon | "Analyzing..." |
| **Tool Call** | Orange/red/rose | Split orb effect | Wrench/tool icon | "Running compare_fields()..." |
| **Error** | Red/dark red | Quick pulse then fade | X icon | "Connection lost" |

### Orb Outer Effects
- **Idle**: No outer ring
- **Listening/Speaking**: 2 concentric ripple rings expanding outward (opacity fade)
- **Thinking**: Subtle rotating ring
- **Tool Call**: Particles emanating from orb (CSS-only)

### Orb Size
- Default: 112px × 112px (w-28 h-28)
- Hover: Scale 1.05
- Active/Click: Scale 0.95 (pressed feel)
- Inner ring: 8px inset, 2px border

---

## 7. Animations & Transitions

### Page Transitions
```css
/* Fade in on page load */
@keyframes page-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.page-enter { animation: page-enter 300ms var(--ease-default); }
```

### Finding Card Slide-In
```css
@keyframes finding-enter {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
```

### Document Processing
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.processing-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Voice Orb Breathing
```css
@keyframes orb-breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.03); opacity: 1; }
}
```

### Transcript Streaming
```css
@keyframes char-appear {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Applied per-character with staggered delay */
```

---

## 8. Responsive Breakpoints

```css
/* Mobile first */
--breakpoint-sm:  640px;    /* Stack panels vertically */
--breakpoint-md:  768px;    /* Show sidebar + main (no doc panel) */
--breakpoint-lg:  1024px;   /* Show all 3 panels */
--breakpoint-xl:  1280px;   /* Wider panels, more breathing room */
--breakpoint-2xl: 1536px;   /* Max width, centered content */
```

### Layout Behavior
| Breakpoint | Sidebar | Center (Voice+Transcript) | Right (Docs+Findings) |
|------------|---------|---------------------------|----------------------|
| < 640px | Hidden (hamburger) | Full width | Hidden (sheet drawer) |
| 640-768px | Icon-only (48px) | Full width | Hidden (sheet drawer) |
| 768-1024px | Icon-only (48px) | Full width | Hidden (toggle button) |
| 1024px+ | Icon-only (48px) | Flex (60%) | Visible (40%, resizable) |
| 1280px+ | Icon-only (48px) | Flex (65%) | Visible (35%, resizable) |

---

## 9. Accessibility Requirements

- All text meets WCAG AA contrast (4.5:1 body, 3:1 large)
- Voice orb: keyboard accessible (Space to toggle, Escape to disconnect)
- Screen reader: orb state announced via aria-live region
- Focus indicators: visible ring on all interactive elements (2px blue outline)
- Reduced motion: disable orb animations, use simple state indicators
- Transcript: auto-scrolling with pause on user scroll
- Color is never the only indicator (always paired with icon or text)

---

## 10. Implementation Order (Design → Code)

### Week 1: Foundation
1. Set up Tailwind v4 with custom CSS variables (color system above)
2. Install Geist font (`next/font/google`)
3. Configure shadcn/ui with dark theme defaults
4. Build layout shell (sidebar + topbar + main area)
5. Implement Clerk auth pages with brand colors

### Week 2: Core Components
1. Build VoiceOrb component (all 7 states, CSS animations)
2. Build DocumentCard component (4 states)
3. Build FindingCard component (3 severity levels)
4. Build ExtractedFieldsList component
5. Integrate LiveKit Agents UI components
6. Wire up the Workspace View (3-panel layout)

### Week 3: Polish
1. Add page transitions and loading states
2. Implement command palette (Cmd+K)
3. Build workspace creation wizard
4. Add responsive behavior (mobile sheets)
5. Final animation tuning and accessibility audit