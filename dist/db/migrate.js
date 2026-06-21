"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
async function migrate() {
    console.log('Running database migrations...');
    await (0, connection_1.query)(`
    CREATE TABLE IF NOT EXISTS queries (
      id SERIAL PRIMARY KEY,
      query TEXT UNIQUE NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
    console.log('  ✓ Created queries table');
    await (0, connection_1.query)(`
    CREATE INDEX IF NOT EXISTS idx_query_prefix ON queries (query text_pattern_ops);
  `);
    console.log('  ✓ Created prefix index');
    await (0, connection_1.query)(`
    CREATE INDEX IF NOT EXISTS idx_query_count ON queries (count DESC);
  `);
    console.log('  ✓ Created count index');
    await (0, connection_1.query)(`
    CREATE TABLE IF NOT EXISTS query_recency (
      query TEXT PRIMARY KEY,
      recent_score DOUBLE PRECISION DEFAULT 0,
      last_seen TIMESTAMP DEFAULT NOW()
    );
  `);
    console.log('  ✓ Created query_recency table');
    await (0, connection_1.query)(`
    CREATE TABLE IF NOT EXISTS performance_metrics (
      id SERIAL PRIMARY KEY,
      endpoint TEXT,
      latency_ms DOUBLE PRECISION,
      cache_hit BOOLEAN,
      timestamp TIMESTAMP DEFAULT NOW()
    );
  `);
    console.log('  ✓ Created performance_metrics table');
    console.log('Migrations complete.');
    process.exit(0);
}
migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map