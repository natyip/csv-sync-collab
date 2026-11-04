backend/
├── src/
│   ├── config/
│   │   └── database.ts         # SQLite connection & table initialization
│   ├── controllers/
│   │   └── recordController.ts # Request handlers (upload, list, search, resolve)
│   ├── services/
│   │   ├── csvService.ts       # CSV parsing, validation, and batch insertion logic
│   │   └── conflictService.ts  # ID matching, diff calculation, and resolution logic
│   ├── sockets/
│   │   └── socketHandler.ts    # Socket.IO connection manager & event emitters
│   ├── tests/
│   │   ├── csvParser.test.ts   # Unit tests for parsing & validation
│   │   └── conflict.test.ts    # Unit tests for conflict detection
│   ├── app.ts                  # Express app setup, middleware, and routes
│   └── server.ts               # HTTP server wrapper initializing Express & Socket.IO
├── data/
│   └── database.sqlite         # SQLite file store (persisted via Docker volume)
├── package.json
└── tsconfig.json

🏛️ Type of Architecture: Service-Oriented Layered Architecture
Routing / Entry Layer (server.ts & app.ts):

Bootstraps the Express application, attaches middleware (cors, express.json), configures API routes, and binds the HTTP server to Socket.IO.

Controller Layer (controllers/):

Thin request handlers. They extract parameters (req.query, req.body, req.file), call the appropriate service, and return standard HTTP JSON responses (200 OK, 400 Bad Request, etc.). They contain zero business logic.

Service Layer (services/):

Where the actual heavy lifting happens.

csvService.ts handles streaming CSV chunks, row validation, and database transactions.

conflictService.ts compares incoming CSV rows against existing records by primary key (id), generates the field-by-field diff, and coordinates with Socket.IO to push updates.

Data Access / Persistence Layer (config/database.ts):

Manages SQLite queries using better-sqlite3. Keeping SQL statements grouped or cleanly abstracted makes it easy to write unit tests and swap queries if needed.