import Redis from 'ioredis';
import { config } from '../config';
import { ConsistentHash } from './consistentHash';
import { SuggestResult, CacheDebugInfo } from '../types';

export class CacheManager {
  private nodes: Redis[];
  private hashRing: ConsistentHash;
  private nodeNames: string[];

  constructor() {
    this.nodeNames = Array.from(
      { length: config.cacheNodeCount },
      (_, i) => `cache-node-${i}`
    );
    this.hashRing = new ConsistentHash(this.nodeNames, config.cacheVirtualNodes);
    this.nodes = this.nodeNames.map(() => new Redis(config.redisUrl));
  }

  private getRedis(nodeName: string): Redis {
    const idx = this.nodeNames.indexOf(nodeName);
    return this.nodes[idx];
  }

  private cacheKey(prefix: string, mode?: string): string {
    const p = prefix.toLowerCase();
    return mode ? `suggest:${mode}:${p}` : `suggest:${p}`;
  }

  async getSuggestions(prefix: string, mode?: string): Promise<SuggestResult[] | null> {
    const key = this.cacheKey(prefix, mode);
    const { node: nodeName } = this.hashRing.getNodeWithPosition(key);
    const redis = this.getRedis(nodeName);

    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as SuggestResult[];
    }

    return null;
  }

  async setSuggestions(prefix: string, results: SuggestResult[], mode?: string): Promise<void> {
    const key = this.cacheKey(prefix, mode);
    const { node: nodeName } = this.hashRing.getNodeWithPosition(key);
    const redis = this.getRedis(nodeName);

    await redis.setex(key, config.cacheTtlSeconds, JSON.stringify(results));
  }

  async debug(prefix: string, mode?: string): Promise<CacheDebugInfo> {
    const key = this.cacheKey(prefix, mode);
    const { node: nodeName, position } = this.hashRing.getNodeWithPosition(key);
    const redis = this.getRedis(nodeName);

    const cached = await redis.get(key);
    const cacheHit = cached !== null;
    const cachedResult = cacheHit ? (JSON.parse(cached!) as SuggestResult[]) : null;

    return {
      prefix,
      cache_node: nodeName,
      hash_ring_position: position,
      cache_hit: cacheHit,
      cached_result: cachedResult,
    };
  }

  async invalidatePrefix(prefix: string, mode?: string): Promise<void> {
    const key = this.cacheKey(prefix, mode);
    const { node: nodeName } = this.hashRing.getNodeWithPosition(key);
    const redis = this.getRedis(nodeName);
    await redis.del(key);
  }

  logRouting(prefix: string, mode?: string): void {
    const key = this.cacheKey(prefix, mode);
    const { node, position } = this.hashRing.getNodeWithPosition(key);
    console.log(
      `[ConsistentHash] key="${key}" position=${position} → node="${node}"`
    );
  }

  async close(): Promise<void> {
    await Promise.all(this.nodes.map((r) => r.quit()));
  }
}

export const cacheManager = new CacheManager();
