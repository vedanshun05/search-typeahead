# Search Typeahead System — HLD101 Assignment

A search typeahead (autocomplete) system with distributed caching via consistent hashing, recency-aware trending, batch writes, and a polished Google-like dropdown frontend.

## Tech Stack

- **Backend:** Node.js + Express (TypeScript)
- **Frontend:** React (vanilla JS, no build step — `React.createElement`)
- **Primary Database:** PostgreSQL
- **Cache:** Redis (3 logical nodes via consistent hashing)
- **Deployment:** Docker + Once (kamal-proxy)

## Architecture

```mermaid
flowchart TB
    subgraph Frontend
        B[React SPA<br/>public/index.html]
    end
    subgraph Backend
        S[Express Server<br/>src/index.ts]
        API[API Routes<br/>src/routes/api.ts]
        SUGG[Trending Engine<br/>src/trending/suggestions.ts]
        BATCH[Batch Writer<br/>src/batch/batchWriter.ts]
        CACHE[Cache Manager<br/>src/cache/cacheManager.ts]
        CH[Consistent Hash Ring<br/>src/cache/consistentHash.ts]
    end
    subgraph Storage
        PG[PostgreSQL<br/>queries + query_recency]
        R1[Redis Node 0]
        R2[Redis Node 1]
        R3[Redis Node 2]
    end

    B -- "GET /api/suggest?q=..." --> API
    B -- "POST /api/search" --> API
    API --> SUGG
    API --> BATCH
    API --> CACHE
    CACHE --> CH
    CH --> R1
    CH --> R2
    CH --> R3
    SUGG --> PG
    BATCH --> PG
```

**Request flow:**
1. User types → frontend debounces 300ms → `GET /api/suggest?q=<prefix>&mode=<basic|enhanced>`
2. Server checks cache via consistent hash ring (which Redis node owns this prefix?)
3. **Cache hit** → return cached suggestions immediately (~10ms)
4. **Cache miss** → query PostgreSQL (`ILIKE` prefix match, sorted by score), cache result with TTL, return
5. User submits a search → `POST /api/search` → query stored in in-memory batch buffer
6. Buffer flushes every 5s or 100 entries → aggregated `INSERT ... ON CONFLICT DO UPDATE` to PostgreSQL

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running on `localhost:5432`
- Redis 6+ running on `localhost:6379`
- Docker (optional, for containerized deployment)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

```bash
psql -U postgres -c "CREATE DATABASE search_typeahead;"
```

### 3. Configure environment

Copy and edit `.env` to match your connection strings:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/search_typeahead
REDIS_URL=redis://localhost:6379
```

### 4. Run migrations

```bash
npm run migrate
```

Creates `queries`, `query_recency`, and `performance_metrics` tables.

### 5. Generate dataset

```bash
npm run generate-data
```

Generates 500,000 unique queries with power-law distribution in `dataset/queries.tsv`.

### 6. Ingest the dataset

```bash
npm run ingest
```

Loads the TSV into PostgreSQL using batched `INSERT ... ON CONFLICT DO UPDATE`.

### 7. Start the server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## APIs

### `GET /api/suggest`

Fetch typeahead suggestions for a prefix.

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Search prefix (required) |
| `mode` | `basic` \| `enhanced` | `basic` | Ranking mode |

**Request:**
```
GET /api/suggest?q=rea&mode=enhanced
```

**Response:**
```json
{
    "prefix": "rea",
    "mode": "enhanced",
    "suggestions": [
        { "query": "react native", "count": 14085 },
        { "query": "react tutorial", "count": 341773 },
        { "query": "react cheatsheet", "count": 500000 }
    ],
    "latency_ms": 9,
    "cache_hit": true
}
```

**Description of modes:**
- **basic** — sorted by all-time count descending
- **enhanced** — weighted blend of count + EMA recency score: `score = 0.3 × norm(count) + 0.7 × norm(recency)`

### `POST /api/search`

Submit a search query (increments count, updates recency).

**Request:**
```json
POST /api/search
Content-Type: application/json

{ "query": "react hooks" }
```

**Response:**
```json
{ "message": "Searched" }
```

The count increment is buffered in-memory and flushed to PostgreSQL in batches (every 5s or 100 entries).

### `GET /api/cache/debug`

Show which Redis node owns a given prefix on the consistent hash ring.

**Request:**
```
GET /api/cache/debug?prefix=react
```

**Response:**
```json
{
    "prefix": "react",
    "hash": 2712753292,
    "assigned_node": "cache-node-1"
}
```

### `GET /api/performance`

Returns batch write statistics.

**Response:**
```json
{
    "batch_writes": {
        "totalWritesWithoutBatching": 118,
        "totalBatchesFlushed": 15,
        "totalWritesWithBatching": 116,
        "currentBufferSize": 0,
        "writeReductionPercent": "87.29"
    }
}
```

### `GET /up`

Health check endpoint (used by Docker/Once for health probes).

**Response:** `ok`

## Frontend Features

- **Google-like dropdown** — suggestions appear below the search bar as you type
- **300ms debounce** — avoids excessive API calls
- **Race-condition guard** — `requestIdRef` ensures stale responses are silently dropped
- **Text highlighting** — matched prefix is bolded in teal
- **3 themes** — Light (default), Dark (warm charcoal + teal), Warm (sepia + amber)
- **Smooth animations** — CSS `max-height` + opacity transition on dropdown
- **Lucide-style inline SVG icons** — search, trending, bar chart, flame
- **Tech stack brand logos** — Node.js, PostgreSQL, Redis, Express

Toggle themes via the settings icon in the top-right corner.

## Screenshots

### Light Theme — Suggestions Dropdown

![Light theme with suggestions](screenshot-light-suggestions.png)

### Dark Theme

![Dark theme with suggestions](screenshot-dark-suggestions.png)

### Warm Theme

![Warm theme with suggestions](screenshot-warm-suggestions.png)

### Empty State (Light)

![Empty search bar](screenshot-light-empty.png)

## Performance Report

Measured against the live deployment at `search-typeahead.localhost`.

| Metric | Value |
|--------|-------|
| **Cache hit latency** | 9–10 ms (p50) |
| **Cache miss latency** | ~25–30 ms (includes PG query + cache write) |
| **Cache hit rate** | ~95% after warm-up (TTL-based, 5 min expiry) |
| **Write reduction (batching)** | **87.29%** |
| DB writes without batching | 118 |
| Batches flushed | 15 |
| Total batched DB writes | 116 |

Without batching, each `POST /api/search` would trigger a separate DB write. With batching, writes are aggregated in memory and flushed every 5 seconds or 100 entries, reducing DB round-trips by 87%.

### Benchmark methodology

- 18 distinct prefixes queried to warm the cache
- 180 search submissions sent in rapid succession
- Latency measured from the client side via `curl` + nanosecond timestamps
- Cache hit/miss reported per-request in the API response body

## Trending Modes

| Mode | Formula | Use Case |
|------|---------|----------|
| **Basic** | `ORDER BY count DESC` | Simple popularity |
| **Enhanced** | `0.3 × norm(count) + 0.7 × norm(recency_ema)` | Recency-aware with EMA decay (α = 0.95) |

The enhanced mode prevents permanently popular queries from drowning out rising trends. The EMA decay factor of 0.95 means a query's recency score halves in ~14 days of inactivity.

## Consistent Hashing

- **Hash function:** SHA-1
- **Virtual nodes:** 150 per physical node (450 total points on the ring)
- **Cache key format:** `suggest:{mode}:{prefix}`
- **Invocation:** TTL (5 minutes) — stale data is acceptable for typeahead

The 150× virtual node replication ensures minimal key redistribution when nodes are added or removed.

## Design Choices

| Choice | Rationale |
|--------|-----------|
| **PostgreSQL over MongoDB** | Structured schema, strong consistency for counts, JOINs not needed |
| **Redis over in-memory cache** | Persistence, shared across processes, TTL built-in |
| **TTL invalidation** | 5-min staleness is acceptable for suggestions; simpler than explicit invalidation |
| **EMA over sliding window** | O(1) update, constant memory, simple math, tunable decay |
| **In-memory batch buffer** | No message queue dependency; crash tolerance (5s window) is acceptable for demo |
| **Consistent hashing** | Minimal redistribution on node changes, proven at scale (Dynamo, Cassandra) |
| **React.createElement** | Zero build dependencies; no Babel/webpack needed for a single-page app |
| **300ms debounce** | Balances responsiveness with API call frequency |

See the Obsidian note (`HLD 101 Notes/Search Typeahead - HLD101 Project.md`) for detailed explanations, production sharding strategy, and mock interview Q&A.

## Docker Deployment

### Local Docker Compose

```bash
docker compose up -d
```

Starts PostgreSQL, Redis, and the app container. Access at `http://localhost:3001`.

### Once Deployment

```bash
docker build -t ghcr.io/vedanshun05/search-typeahead:latest .
docker push ghcr.io/vedanshun05/search-typeahead:latest
once deploy --install ghcr.io/vedanshun05/search-typeahead:latest
```

Set these environment variables in Once app settings:

```
DATABASE_URL=postgresql://postgres:postgres@<pg-ip>:5432/search_typeahead
REDIS_URL=redis://<redis-ip>:6379
```

Requires the app container to be on the same Docker network as PG/Redis.

## Project Structure

```
search-typeahead/
├── dataset/queries.tsv          # Generated dataset (500k queries)
├── scripts/generate-data.ts     # Dataset generator
├── src/
│   ├── index.ts                 # Express entry point + /up healthcheck
│   ├── config.ts                # Environment variable definitions
│   ├── db/
│   │   ├── connection.ts        # PostgreSQL connection pool
│   │   ├── migrate.ts           # Schema migration
│   │   └── ingest.ts            # TSV ingestion
│   ├── cache/
│   │   ├── consistentHash.ts    # SHA-1 hash ring + virtual nodes
│   │   └── cacheManager.ts      # Redis cache with cache-aside pattern
│   ├── batch/
│   │   └── batchWriter.ts       # In-memory buffer + periodic flush
│   ├── trending/
│   │   └── suggestions.ts       # Basic + enhanced suggestion queries
│   ├── routes/
│   │   └── api.ts               # All API route handlers
│   └── types/index.ts           # TypeScript interfaces
├── public/index.html            # React SPA (3 themes, SVGs, highlight)
├── Dockerfile                   # Multi-stage build (Node 20 Alpine)
├── docker-compose.yml           # 3-service stack for local testing
├── docker-entrypoint.sh         # Server first, then migrate+ingest
├── once.json                    # Once deployment metadata
├── .env.example
├── package.json
└── tsconfig.json
```
