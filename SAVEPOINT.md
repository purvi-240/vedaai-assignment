# VedaAI — Savepoint (May 27, 2026)

Checkpoint of all work completed through the Create Assignment screen polish.

## What is saved

### Screens done
1. **Assignments — empty** (`/assignments`)
2. **Assignments — filled** (`/assignments` with mock data)
3. **Create Assignment — Step 1** (`/assignments/create`)

### Create Assignment (`/assignments/create`) — current state
- Figma-matched layout: sidebar, header, title, progress, white card, footer nav
- **Assignment Details** card: upload, due date, **4 question types**, totals, additional info
- Default totals: **25 questions**, **60 marks**
- No page scroll — single-screen fit in **688px** content area
- **Add Question Type** — black, bold
- **(For better output)** — black, bold
- Previous / Next below the card

### Run locally
```bash
cd /Users/Purvi/Desktop/veda_ai
npm install
npm run dev
```
Open: http://localhost:3000/assignments/create

### Main paths
```
frontend/app/assignments/page.tsx
frontend/app/assignments/create/page.tsx
frontend/app/globals.css
frontend/components/AssignmentForm/
frontend/components/create-assignment/
frontend/store/assignmentStore.ts
frontend/styles/design-tokens.css
PROGRESS.md
```

## Not built yet
- Assignment output / generated paper screen
- Create flow step 2+
- Live API wiring for assignment list
