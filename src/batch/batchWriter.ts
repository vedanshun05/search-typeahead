import { config } from '../config';
import { query as dbQuery } from '../db/connection';
import { cacheManager } from '../cache/cacheManager';

class BatchWriter {
  private buffer: Map<string, number> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private totalWritesWithoutBatching: number = 0;
  private totalBatchesFlushed: number = 0;
  private totalWritesWithBatching: number = 0;

  start(): void {
    this.timer = setInterval(() => {
      this.flush();
    }, config.batchFlushIntervalMs);

    process.on('SIGTERM', () => this.flushAndExit());
    process.on('SIGINT', () => this.flushAndExit());

    console.log(
      `[BatchWriter] Started: flush every ${config.batchFlushIntervalMs}ms or ${config.batchBufferSize} entries`
    );
  }

  increment(queryText: string): void {
    const normalized = queryText.trim().toLowerCase();
    if (!normalized) return;

    const current = this.buffer.get(normalized) || 0;
    this.buffer.set(normalized, current + 1);
    this.totalWritesWithoutBatching++;

    if (this.buffer.size >= config.batchBufferSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.size === 0) return;

    const entries = Array.from(this.buffer.entries());
    this.buffer.clear();

    const now = new Date().toISOString();
    const values = entries
      .map(
        ([q, c], i) =>
          `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}::timestamp)`
      )
      .join(', ');

    const params: any[] = [];
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
      await dbQuery(sql, params);
      this.totalBatchesFlushed++;
      this.totalWritesWithBatching += entries.length;

      console.log(
        `[BatchWriter] Flushed ${entries.length} queries (batch #${this.totalBatchesFlushed})`
      );
    } catch (err) {
      console.error('[BatchWriter] Flush failed:', err);
    }
  }

  getStats() {
    return {
      totalWritesWithoutBatching: this.totalWritesWithoutBatching,
      totalBatchesFlushed: this.totalBatchesFlushed,
      totalWritesWithBatching: this.totalWritesWithBatching,
      currentBufferSize: this.buffer.size,
      writeReductionPercent:
        this.totalWritesWithoutBatching > 0
          ? (
              ((this.totalWritesWithoutBatching - this.totalBatchesFlushed) /
                this.totalWritesWithoutBatching) *
              100
            ).toFixed(2)
          : '0.00',
    };
  }

  private flushAndExit(): void {
    console.log('[BatchWriter] Shutting down, flushing buffer...');
    this.flush().finally(() => {
      console.log('[BatchWriter] Final flush complete. Exiting.');
      process.exit(0);
    });
  }
}

export const batchWriter = new BatchWriter();
