# CSV Sync & Collaboration

A real-time CSV data management application built for the Technical Assessment. It supports CSV upload with validation feedback, paginated data listing, search, and real-time collaboration across multiple browser sessions with conflict detection and a live diff UI.

## Features

### 1. CSV Upload with Progress Feedback
- Drag-and-drop or click-to-browse file selection
- Live upload progress bar with status indicators (transmitting, success, error)
- Strict server-side validation: required header schema (`postId, id, name, email, body`), per-row mandatory-field checks, BOM/quote/whitespace stripping
- Per-row error reporting so partial failures are surfaced clearly

### 2. Paginated Data Listing
- Server-side pagination backed by SQLite
- Page size of 10 records per page with previous/next navigation
- Result count summary ("Showing X to Y of Z results")

### 3. Search
- Debounced search (300ms) across `name`, `email`, and `body` fields
- Server-side `LIKE` query keeps the table responsive for large datasets
- Clears back to the full list instantly

### 4. Real-Time Collaboration (Socket.IO)
- Two browser sessions editing the same dataset stay in sync without page refresh
- A live-connection indicator in the header shows WebSocket status
- When one user uploads a CSV that overlaps existing records (matched by `id`), the app:
  - **Detects duplicates/conflicts** by comparing incoming rows against stored records field-by-field
  - **Broadcasts a `CONFLICT_DETECTED` event** to all connected clients instantly
  - **Displays a real-time diff UI** showing old vs. new values per changed field
- Identical records are auto-accepted; genuinely new records are inserted immediately

### 5. Conflict Resolution (Optional feature — implemented)
- Users can choose, per conflicting record, to **KEEP** the existing version or **OVERWRITE** with the incoming version
- Resolutions are applied atomically in a single SQLite transaction
- A `DATA_UPDATED` event is broadcast so every connected session reflects the final state within seconds

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Socket.IO Client, lucide-react |
| Backend | Node.js, Express 5, TypeScript, Socket.IO, Multer, csv-parser |
| Database | SQLite (via `better-sqlite3`, WAL mode) |
| Testing | Vitest, Supertest, Testing Library |
| DevOps | Docker Compose, GitHub Actions CI |

---

## Project Structure

```
.
├── docker-compose.yml          # Orchestrates frontend + backend containers
├── data.csv                    # Sample CSV used for the assessment
├── test_10_duplicates.csv      # Test fixture: duplicate IDs
├── test_7_conflicts.csv        # Test fixture: conflicting field values
├── .github/workflows/
│   └── backend-ci.yml          # CI pipeline (runs backend unit tests)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.ts              # Express app + middleware setup
│       ├── server.ts           # HTTP server + Socket.IO init entrypoint
│       ├── config/database.ts  # SQLite connection + schema init
│       ├── controllers/
│       │   └── recordController.ts   # List, upload, resolve handlers
│       ├── routes/recordRoutes.ts    # /api routes + multer config
│       ├── services/
│       │   ├── csvService.ts         # CSV parse, validate, insert
│       │   └── conflictService.ts    # Diff incoming vs. existing records
│       ├── sockets/
│       │   ├── socketHandler.ts      # Socket.IO server singleton
│       │   └── eventEmitter.ts       # Broadcast helpers + event enum
│       └── tests/                    # 7 backend unit-test suites
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.tsx             # Main dashboard layout + state orchestration
        ├── components/
        │   ├── FileUpload.tsx  # Dropzone + progress UI
        │   ├── DataTable.tsx   # Records table with loading/empty/error states
        │   ├── SearchBar.tsx   # Debounced search input
        │   └── Pagination.tsx  # Page navigation controls
        ├── services/
        │   ├── api.ts          # REST calls (fetch, upload, resolve)
        │   └── socket.ts       # Socket.IO client singleton
        ├── types/index.ts      # Shared TypeScript interfaces
        └── services/*.test.ts  # Frontend unit tests
```

---

## Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) (recommended)
- Or, for local development: **Node.js 20+** and **npm**

---

## Getting Started

### Option A — Docker Compose (recommended)

This runs both the backend and frontend in isolated containers.

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd <repo-folder>

# 2. Build and start all services
docker compose up --build

# 3. Open the app
#    Frontend: http://localhost:3000
#    Backend API: http://localhost:5000/api
#    Health check: http://localhost:5000/api/health
```

To stop the services:

```bash
docker compose down
```

### Option B — Local Development (without Docker)

**Backend** (runs on port 5000):

```bash
cd backend
npm install
npm run dev          # starts with tsx watch (auto-reload)
```

**Frontend** (runs on port 5173):

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

> The frontend expects the backend at `http://localhost:5000/api` and the WebSocket server at `http://localhost:5000`. These are configured in `frontend/src/services/api.ts` and `frontend/src/services/socket.ts`.

---

## Usage Guide

1. **Upload data** — Click the dropzone or drag `data.csv` onto it. The progress bar tracks the upload; a success banner confirms how many records were imported.
2. **Browse records** — The table paginates 10 records at a time. Use Previous/Next to navigate.
3. **Search** — Type into the search box. Results filter across name, email, and body fields after a short debounce.
4. **Test collaboration** — Open the app in two browser windows side by side. Upload `data.csv` in one. The other window updates automatically.
5. **Test conflicts** — Upload `test_7_conflicts.csv` (or `test_10_duplicates.csv`) in one window. A conflict diff panel appears in both sessions. Choose KEEP or OVERWRITE per row and submit — both windows reflect the resolved state within seconds.

---

## API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | Health check — returns `{ status: "ok" }` |
| `GET`  | `/records?page=1&limit=10&search=` | List records with pagination + search |
| `POST` | `/upload` | Upload a CSV file (multipart form field `file`) |
| `POST` | `/resolve` | Submit conflict resolutions (KEEP / OVERWRITE per record) |

### Socket.IO Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `CONFLICT_DETECTED` | Server → Client | `{ conflicts: ConflictItem[], message, timestamp }` | Notifies all clients of overlapping records requiring resolution |
| `DATA_UPDATED` | Server → Client | `{ message, timestamp }` | Triggers all clients to refresh their current view |

---

## CSV Format

The uploaded file must match this exact header schema (order-insensitive, but no missing or extra columns):

```
postId,id,name,email,body
```

- **All five fields are mandatory** for every row; rows with empty fields are skipped and reported as errors.
- The `id` column is the unique identifier used for duplicate/conflict detection.
- BOM characters, surrounding quotes, and whitespace in headers are stripped automatically.

A valid sample (`data.csv`) is included in the repository root.

---

## Testing

The project includes unit tests covering core logic and edge cases.

### Backend Tests

```bash
cd backend
npm test
```

Test suites:

| File | Coverage |
|------|----------|
| `csvParser.test.ts` | Valid CSV, missing headers, extra headers, empty fields |
| `conflictService.test.ts` | New inserts, identical records, field-level diff detection |
| `database.test.ts` | Schema initialization, connection factory |
| `recordController.test.ts` | List/upload/resolve handler responses |
| `recordRoutes.test.ts` | Route wiring + multer file filtering |
| `socketHandler.test.ts` | Socket.IO server init + singleton getter |
| `eventEmitter.test.ts` | Event broadcast helpers |

> The CI workflow (`.github/workflows/backend-ci.yml`) runs `npm run test_github`, which excludes the `database.test.ts` suite (it requires a writable filesystem not available in the CI sandbox).

### Frontend Tests

```bash
cd frontend
npm test
```

Test suites: `api.test.ts` (REST client) and `socket.test.ts` (Socket.IO client).

---

## Continuous Integration

A GitHub Actions workflow (`.github/workflows/backend-ci.yml`) runs on every push and pull request to `main`/`master`. It:

1. Checks out the code
2. Sets up Node.js 20 with npm cache
3. Installs backend dependencies
4. Runs the backend unit test suite

---

## Design Decisions

- **SQLite over a heavier DB** — the assessment data is single-table and read-heavy; `better-sqlite3` with WAL mode gives synchronous, transactional access with zero external dependencies, ideal for a Dockerized demo.
- **Memory-storage Multer** — uploaded CSVs are processed from an in-memory buffer via streams, avoiding disk I/O and simplifying cleanup.
- **Strict header validation** — rejecting missing or extra columns up front prevents silent data corruption downstream.
- **Field-level diffing** — conflicts are detected by comparing each comparable field (`postId, name, email, body`) rather than treating any overlap as a conflict, so identical re-uploads are no-ops.
- **Atomic resolution** — conflict resolutions are wrapped in a single SQLite transaction so a partial failure cannot leave the dataset half-updated.

---

## Environment Variables

| Variable | Default | Where |
|----------|---------|-------|
| `PORT` | `5000` | Backend |
| `NODE_ENV` | `development` | Backend |
| `VITE_API_URL` | `http://localhost:5000/api` | Frontend (Docker) |

No external API keys or secrets are required.

---

## License

ISC
