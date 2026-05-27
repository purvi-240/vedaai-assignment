# VedaAI — Implementation Progress

> **Last updated:** May 27, 2026  
> This document captures everything built so far. Remaining Figma screens and polish will be updated here as work continues.

---

## Project overview

**VedaAI Assessment Creator** — hiring assignment monorepo with a Next.js frontend and Express backend for assignment creation, AI question-paper generation, and real-time updates via WebSocket.

| Layer | Stack |
|-------|--------|
| Frontend | Next.js 16, TypeScript, Zustand, CSS design tokens |
| Backend | Node.js, Express, MongoDB (Mongoose), Redis, BullMQ |
| AI | OpenAI (with dev fallbacks when no API key) |
| Realtime | WebSocket at `/ws` |

---

## Repository structure

```
veda_ai/
├── frontend/                 # Next.js app (:3000)
│   ├── app/                  # App Router pages
│   ├── components/           # UI components
│   ├── data/                 # Mock data
│   ├── lib/                  # WebSocket client
│   ├── store/                # Zustand (assignment form)
│   └── styles/               # design-tokens.css
├── backend/                  # Express API (:8080)
│   └── src/
│       ├── config/           # env, database, redis
│       ├── models/           # Assignment, QuestionPaper
│       ├── queues/           # BullMQ + inline fallback
│       ├── routes/           # REST API
│       ├── services/ai/      # prompt → LLM → parse
│       └── websocket/        # WS server + broadcast
├── docker-compose.yml        # MongoDB + Redis (optional)
├── package.json              # Monorepo workspaces
└── PROGRESS.md               # This file
```

---

## How to run

```bash
cd /Users/Purvi/Desktop/veda_ai
npm install

# Optional (if Docker works)
npm run docker:up

# Start frontend + backend
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Assignments dashboard | http://localhost:3000/assignments |
| Create assignment | http://localhost:3000/assignments/create |
| Backend health | http://localhost:8080/health |
| WebSocket | ws://localhost:8080/ws |

### Environment files

**`frontend/.env.local`**
```
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**`backend/.env`** (see `backend/.env.example`)
```
PORT=8080
MONGODB_URI=mongodb://localhost:27017/veda_ai
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key_here
LLM_MODEL=gpt-4o-mini
```

### Dev fallbacks (no Docker required)

- **MongoDB:** `mongodb-memory-server` when local MongoDB is unavailable
- **Redis/BullMQ:** Inline job processing when Redis is not running

---

## Frontend — routes

| Route | Status | Description |
|-------|--------|-------------|
| `/` | Done | Redirects to `/assignments` |
| `/assignments` | Done | Empty or filled dashboard (mock-driven) |
| `/assignments/create` | Done | Screen 3 — Create Assignment (Step 1: Assignment Details) |
| `/assignments/[id]` | Placeholder | Detail page stub |

---

## Frontend — screens implemented

### 1. Assignments — Empty state (Screen 1)

- Desktop: sidebar (304px), header (1100×56), empty illustration + CTA
- Mobile: top header, page bar, bottom nav, FAB
- **Create Assignment** links to `/assignments/create`
- Shown when assignment list is empty (delete all mock cards to test)

**Key files:**
- `components/assignments/AssignmentsEmptyState.tsx`
- `components/layout/AppShell.tsx`, `Sidebar.tsx`, `DashboardHeader.tsx`, `MobileNav.tsx`

### 2. Assignments — Filled state (Screen 2)

Matches Figma **Filled State** (FIXED header + SCROLLS body).

**Layout**
- Sidebar: VedaAI logo, **+ Create Assignment** (orange glow border), nav with **Assignments** active + badge **10**, org profile (Delhi Public School)
- Header: back arrow, grid icon, breadcrumb **Assignment**, notifications, **John Doe**
- Page title: green status dot + **Assignments** (bold) + subtitle
- Toolbar: single white bar — **Filter By** | **Search Assignment**
- Grid: 2 columns, cards stretch to fill **1100px** content width
- Floating CTA: **+ Create Assignment** (bottom center)
- Scroll fade at bottom of grid

**Assignment card (quiz box)**
| Spec | Value |
|------|--------|
| Size | **542 × 162** (per column in 2-col grid) |
| Padding | **16px** all sides |
| Gap | **16px** row / column |
| Border radius | **16px** (Figma XS) |
| Border | 1px `#F0F0F0` |
| Shadow | `0 4px 12px rgba(0,0,0,0.05)` |

**Typography**
- **Bold (700):** card title, `Assigned on :`, `Due :`, page title, header breadcrumb, Filter By
- **Regular (400):** dates `20-06-2025` / `21-06-2025`

**Card menu (⋮ — Classes Dropdown)**
- Opens **on click** only (portal, not clipped by scroll)
- Size: **140 × 84** (2 × 42px rows)
- **View Assignment** — plain text
- **Delete** — red `#C53535`, light grey hover `#F0F0F0`, rounded
- Closes on outside click or Escape

**Key files:**
- `components/assignments/AssignmentsFilledState.tsx`
- `components/assignments/AssignmentCard.tsx`
- `components/assignments/AssignmentsToolbar.tsx`
- `components/assignments/AssignmentsPageClient.tsx`
- `data/mockAssignments.ts` (6 × "Quiz on Electricity")

### 3. Create Assignment — Assignment Details (Screen 3)

Matches Figma **Assignment Creation Flow** — Step 1 (desktop + mobile).

**Layout**
- Sidebar: **+ Create Assignment** highlighted (orange glow) on `/assignments/create`
- Header: back, **Assignment**, notifications, John Doe
- Title: green dot + **Create Assignment** + subtitle “Set up a new assignment for your students.”
- Progress bar: step 1 active (50% fill)
- White card: **Assignment Details** / “Basic information about your assignment”

**Form fields**
| Section | Details |
|---------|---------|
| File upload | Dashed dropzone, cloud icon, “Choose a file or drag & drop it here”, JPEG/PNG upto 10MB, **Browse Files**, hint text |
| Due Date | **DD-MM-YYYY** placeholder, calendar icon |
| Question types | Table (desktop): dropdown + **+/-** steppers for count & marks, remove row, **+ Add Question Type** |
| Totals | **Total Questions :** and **Total Marks :** (bold, computed) |
| Additional info | Textarea + mic icon, placeholder per Figma |
| Footer | **← Previous** (to `/assignments`) + **Next →** (validates + WS payload) |

**Default question rows (exactly 4 types — Figma)**
| Type | Count | Marks |
|------|-------|-------|
| Multiple Choice Questions | 4 | 1 |
| Short Questions | 3 | 2 |
| Diagram/Graph-Based Questions | 8 | 5 |
| Numerical Problems | 10 | 1 |

→ Totals: **25 questions**, **60 marks** (computed live)

**Single-screen fit (no scroll)**
- Frame: sidebar **304×744**, main **1100×744**, content **688px**
- All visible: upload, due date, 4 question rows, add/totals, additional info, Previous/Next
- **Previous / Next** below white card on gray panel

**Typography**
- **Add Question Type** — black `#000000`, bold (700)
- **Additional Information** + **(For better output)** — black, bold

**Mobile**
- Stacked question-type cards (dropdown + side-by-side steppers)
- Bottom nav + form footer buttons side-by-side

**Key files:**
- `components/create-assignment/CreateAssignmentHeader.tsx`
- `components/create-assignment/FormStepNav.tsx`
- `components/create-assignment/NumberStepper.tsx`
- `components/AssignmentForm/AssignmentForm.tsx`
- `components/AssignmentForm/FileUpload.tsx`
- `components/AssignmentForm/QuestionTypes.tsx`
- `components/AssignmentForm/QuestionTypesFooter.tsx`
- `components/AssignmentForm/AdditionalInformation.tsx`
- `components/icons/FormIcons.tsx`
- `store/assignmentStore.ts` (`CREATE_ASSIGNMENT_QUESTION_TYPES`, `DEFAULT_CREATE_QUESTION_ROWS`)
- `validation/assignmentSchema.ts`

### 4. Mobile responsive

- Breakpoint: `max-width: 900px`
- Sidebar hidden; mobile header, page bar, bottom nav (Home, Assignments, Library, AI Toolkit)
- Single-column assignment cards on mobile
- Mobile toolbar: Filter By + Search Name

---

## Design tokens (`frontend/styles/design-tokens.css`)

### Frame dimensions (desktop)

| Token | Value |
|-------|--------|
| Frame width | 1440px |
| Sidebar | 304 × 756 (filled: 820 height) |
| Main panel | 1100 × 756 (filled: 822 height) |
| Header | 1100 × 56 |
| Content (empty) | 1100 × 678 |
| Content (filled) | 1100 × 766 |

### Border radii (Figma)

| Token | Value | Usage |
|-------|--------|--------|
| `--radius-s` | 20px | Sidebar, main panel, toolbar |
| `--radius-xs` | 16px | Cards, dropdown menu |

### Colors (Figma palette)

| Token | Hex |
|-------|-----|
| Text/Primary | `#303030` |
| Text/Secondary | `#5E5E5E` @ 80% |
| Text/Secondary Muted | `#5E5E5E` @ 55% |
| Background/white | `#FFFFFF` |
| Background/bg-off white | `#F0F0F0` |
| Background/bg-off white primary | `#F6F6F6` |
| Buttons/primary Orange | `#FF5623` |
| Utilities/Error | `#C53535` |
| Status green | `#4BC26D` |
| Black (CTAs) | `#272727` |

### Logo gradient

`#FF7950` → `#C0350A`

---

## Backend — implemented

| Feature | Status |
|---------|--------|
| Express app + CORS + JSON | Done |
| `GET /health` | Done |
| `POST /api/assignments` (create) | Done |
| MongoDB models: `Assignment`, `QuestionPaper` | Done |
| BullMQ queue `generate-questions` | Done |
| Inline processing when Redis unavailable | Done |
| WebSocket server `/ws` | Done |
| AI pipeline: structured prompt → LLM → parse JSON | Done |
| Dev: in-memory MongoDB, mock LLM without API key | Done |

**Key files:**
- `backend/src/index.ts`, `app.ts`
- `backend/src/routes/assignments.ts`
- `backend/src/models/Assignment.ts`, `QuestionPaper.ts`
- `backend/src/queues/assignmentQueue.ts`
- `backend/src/services/jobProcessor.ts`
- `backend/src/services/ai/*`
- `backend/src/websocket/*`

---

## Data & state (current)

- **Assignments list:** `frontend/data/mockAssignments.ts` (not yet wired to API)
- **Empty vs filled:** `AssignmentsPageClient` — empty when `assignments.length === 0`
- **Delete:** removes item from local state only
- **Form:** Zustand `assignmentStore` — not persisted to backend from list page yet

---

## Figma file mapping (reference)

| Figma section | Implementation status |
|---------------|----------------------|
| **0 State screen** (empty assignments) | Done |
| **Filled State** (assignments grid) | Done |
| **Assignment Creation Flow - Responsive** | Step 1 done (Screen 3); Step 2+ not started |
| **Assignment Output** (generated question paper) | Not started |
| **Dashboard** (mobile frames) | Partial (mobile nav on assignments) |
| **Note** | Not started |

---

## Not done yet (to update after more screens)

- [ ] Wire assignments list to `GET /api/assignments` (replace mock data)
- [ ] Assignment detail / view page UI
- [ ] Assignment Output screen (AI-generated question paper display)
- [ ] Create Assignment Step 2+ (Next screen after Assignment Details)
- [ ] Remaining Figma screens from **Assignment Creation Flow**
- [ ] Full mobile Dashboard frames per Figma
- [ ] Pixel-perfect pass on all breakpoints
- [ ] End-to-end: create → generate → view output
- [ ] Production env, tests, error states

---

## Issues resolved during development

| Issue | Fix |
|-------|-----|
| Redis `ECONNREFUSED` | Lazy Redis init + inline queue processing |
| MongoDB unavailable | `mongodb-memory-server` in dev |
| Docker permission denied | Dev works without Docker |
| Wrong port (Vite :5173) | Next.js on :3000 |
| Grid gaps too large | `align-content: start`, explicit gaps |
| Cards not full width | `grid-template-columns: repeat(2, minmax(0, 1fr))` |
| Dropdown clipped / not on click | React portal + fixed positioning; menu closed by default |
| Type merge for `AssignmentListItem` | Unified in `types/assignment.ts` |

---

## Key dependencies

**Frontend:** `next`, `react`, `zustand`, `zod`, `tailwindcss` (import in globals)

**Backend:** `express`, `mongoose`, `bullmq`, `ioredis`, `openai`, `mongodb-memory-server`, `ws`

---

## Notes for next session

1. Open `PROGRESS.md` and tick items under **Not done yet** as screens ship.
2. Figma source: **VedaAI - Hiring Assignment** — layers **Filled State**, **0 State screen**, **Assignment Creation Flow**.
3. When adding a new screen, document: route, components, Figma frame name, and dimensions here.
