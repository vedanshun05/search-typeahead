# Search Typeahead System — HLD101 Assignment

A search typeahead system (autocomplete/suggest) built for the HLD101 course. Shows popular query suggestions as the user types, supports search submissions with count updates, distributed caching via consistent hashing, recency-aware trending, and batch writes.

## Tech Stack

- **Backend:** Node.js + Express (TypeScript)
- **Frontend:** React (vanilla JS)
- **Primary Database:** PostgreSQL
- **Cache:** Redis (3 logical nodes via consistent hashing)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running on `localhost:5432`
- Redis 6+ running on `localhost:6379`

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

```bash
psql -U postgres -c "CREATE DATABASE search_typeahead;"
```

### 3. Update `.env` if needed

Edit `.env` to match your PostgreSQL/Redis connection strings.

### 4. Run migrations

```bash
npm run migrate
```

### 5. Generate dataset (or use your own)

```bash
node scripts/generateDataset.js
```

This generates ~110K queries with realistic counts in `dataset/queries.tsv`. You can also use any TSV file with `query\tcount` format.

### 6. Ingest the dataset

```bash
npm run ingest -- --file=dataset/queries.tsv
```

### 7. Start the server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## APIs

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/suggest?q=<prefix>&mode=<basic\|enhanced>` | Fetch up to 10 suggestions |
| `POST` | `/api/search` | Submit a search (body: `{"query":"..."}`) |
| `GET` | `/api/cache/debug?prefix=<prefix>` | Debug cache routing (consistent hashing) |
| `GET` | `/api/performance` | Batch write statistics |
| `GET` | `/api/health` | Health check |

## Features

### Typeahead Suggestions
- Prefix-matching with `ILIKE` (case-insensitive)
- Limited to 10 results, sorted by count (basic mode) or recency-aware score (enhanced mode)
- Returned via cache (Redis) with TTL-based expiry for low latency
- Cache distributed across 3 logical nodes using consistent hashing (SHA-1, 150 virtual nodes each)

### Search Submission
- Returns `{"message": "Searched"}` after accepting a query
- Query count updated via batch write buffer (not synchronous DB write)
- Recency score updated using exponential moving average

### Trending Searches
- **Basic mode:** Sorted by all-time count descending
- **Enhanced mode:** Weighted combination of all-time count and EMA recency score
  - `final_score = α * norm(all_time_count) + (1-α) * norm(recency_score)`
  - Default α = 0.3, can be configured in `.env`
  - EMA decay factor = 0.95 prevents permanent over-ranking

### Batch Writes
- In-memory buffer aggregates search submissions
- Flushes every 5 seconds OR when buffer reaches 100 entries
- `INSERT ... ON CONFLICT DO UPDATE` for aggregated upserts
- Graceful shutdown flushes remaining buffer

### Consistent Hashing
- SHA-1 hash ring with 450 virtual points (150 per node)
- Minimal key redistribution when nodes are added/removed
- `/api/cache/debug?prefix=<prefix>` shows which node owns a key

## Performance

The batch write system reports:
- Writes without batching (simulated)
- Actual batch flushes performed
- Percentage write reduction

Cache hit/miss status shown per request in the UI.

## Project Structure

```
search-typeahead/
├── dataset/queries.tsv        # Generated dataset
├── scripts/generateDataset.js # Dataset generator
├── src/
│   ├── index.ts               # Express entry point
│   ├── config.ts              # Configuration from .env
│   ├── db/
│   │   ├── connection.ts      # PostgreSQL connection pool
│   │   ├── migrate.ts         # Schema migration script
│   │   └── ingest.ts          # Dataset ingestion script
│   ├── cache/
│   │   ├── consistentHash.ts  # Consistent hashing implementation
│   │   └── cacheManager.ts    # Redis cache layer
│   ├── batch/
│   │   └── batchWriter.ts     # Batch write buffer & flush
│   ├── trending/
│   │   └── suggestions.ts     # Basic & enhanced suggestion queries
│   ├── routes/
│   │   └── api.ts             # Express API routes
│   └── types/index.ts         # TypeScript type definitions
├── public/index.html          # React frontend (single-page app)
├── .env                       # Environment variables
├── package.json
└── tsconfig.json
```

## Design Choices

See the Obsidian note (`HLD 101 Notes/Search Typeahead - HLD101 Project.md`) for detailed explanations of:

- Why PostgreSQL over MongoDB/SQLite
- Why Redis over in-memory cache
- Why TTL cache invalidation over explicit
- Why EMA for recency over sliding window
- Why in-memory buffer for batching over durable queue
- Consistent hashing with virtual nodes
- Production sharding strategy
- Mock interview Q&A
