"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchWriter = void 0;
const config_1 = require("../config");
const connection_1 = require("../db/connection");
class BatchWriter {
    constructor() {
        this.buffer = new Map();
        this.timer = null;
        this.totalWritesWithoutBatching = 0;
        this.totalBatchesFlushed = 0;
        this.totalWritesWithBatching = 0;
    }
    start() {
        this.timer = setInterval(() => {
            this.flush();
        }, config_1.config.batchFlushIntervalMs);
        process.on('SIGTERM', () => this.flushAndExit());
        process.on('SIGINT', () => this.flushAndExit());
        console.log(`[BatchWriter] Started: flush every ${config_1.config.batchFlushIntervalMs}ms or ${config_1.config.batchBufferSize} entries`);
    }
    increment(queryText) {
        const normalized = queryText.trim().toLowerCase();
        if (!normalized)
            return;
        const current = this.buffer.get(normalized) || 0;
        this.buffer.set(normalized, current + 1);
        this.totalWritesWithoutBatching++;
        if (this.buffer.size >= config_1.config.batchBufferSize) {
            this.flush();
        }
    }
    async flush() {
        if (this.buffer.size === 0)
            return;
        const entries = Array.from(this.buffer.entries());
        this.buffer.clear();
        const now = new Date().toISOString();
        const values = entries
            .map(([q, c], i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}::timestamp)`)
            .join(', ');
        const params = [];
        for (const [queryText, count] of entries) {
            params.push(queryText, count, now);
        }
        const sql = `
      INSERT INTO queries (query, count, updated_at)
      VALUES ${values}
      ON CONFLICT (query)
      DO UPDATE SET
        count = queries.count + EXCLUDED.count,
        updated_at = EXCLUDED.updated_at
    `;
        try {
            await (0, connection_1.query)(sql, params);
            this.totalBatchesFlushed++;
            this.totalWritesWithBatching += entries.length;
            console.log(`[BatchWriter] Flushed ${entries.length} queries (batch #${this.totalBatchesFlushed})`);
        }
        catch (err) {
            console.error('[BatchWriter] Flush failed:', err);
        }
    }
    getStats() {
        return {
            totalWritesWithoutBatching: this.totalWritesWithoutBatching,
            totalBatchesFlushed: this.totalBatchesFlushed,
            totalWritesWithBatching: this.totalWritesWithBatching,
            currentBufferSize: this.buffer.size,
            writeReductionPercent: this.totalWritesWithoutBatching > 0
                ? (((this.totalWritesWithoutBatching - this.totalBatchesFlushed) /
                    this.totalWritesWithoutBatching) *
                    100).toFixed(2)
                : '0.00',
        };
    }
    flushAndExit() {
        console.log('[BatchWriter] Shutting down, flushing buffer...');
        this.flush().finally(() => {
            console.log('[BatchWriter] Final flush complete. Exiting.');
            process.exit(0);
        });
    }
}
exports.batchWriter = new BatchWriter();
//# sourceMappingURL=batchWriter.js.map