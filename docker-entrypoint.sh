#!/bin/sh
set -e

echo "=== Search Typeahead - Starting ==="

echo "[1/3] Starting server..."
node dist/index.js &

SERVER_PID=$!

echo "  Waiting for server to be ready..."
for i in $(seq 1 15); do
  if wget --no-verbose --tries=1 --spider http://localhost:80/up 2>/dev/null; then
    echo "  Server is ready."
    break
  fi
  sleep 1
done

echo "[2/3] Running database migrations..."
if node dist/db/migrate.js 2>/dev/null; then
  echo "  Migrations complete."

  echo "[3/3] Checking if data ingestion needed..."
  ROW_COUNT=$(node -e "
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.query('SELECT COUNT(*) as cnt FROM queries')
      .then(r => { console.log(r.rows[0].cnt); process.exit(0); })
      .catch(e => { console.log('0'); process.exit(0); });
  ")

  if [ "$ROW_COUNT" = "0" ] || [ -z "$ROW_COUNT" ]; then
    echo "  Data not found. Ingesting dataset..."
    node dist/db/ingest.js --file=dataset/queries.tsv
  else
    echo "  Data already present ($ROW_COUNT queries). Skipping ingest."
  fi
else
  echo "  Migrations skipped (database not ready). Set DATABASE_URL and restart."
fi

echo "=== Server running on port 80 ==="

wait $SERVER_PID
