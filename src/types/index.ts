export interface QueryRow {
  id?: number;
  query: string;
  count: number;
  updated_at?: Date;
}

export interface QueryRecencyRow {
  query: string;
  recent_score: number;
  last_seen: Date;
}

export interface SuggestResult {
  query: string;
  count: number;
}

export interface CacheDebugInfo {
  prefix: string;
  cache_node: string;
  hash_ring_position: number;
  cache_hit: boolean;
  cached_result: SuggestResult[] | null;
}

export interface Config {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  cacheTtlSeconds: number;
  cacheNodeCount: number;
  cacheVirtualNodes: number;
  batchFlushIntervalMs: number;
  batchBufferSize: number;
  trendingAlpha: number;
  trendingDecay: number;
}
