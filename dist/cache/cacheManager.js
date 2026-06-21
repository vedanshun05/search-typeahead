"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheManager = exports.CacheManager = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
const consistentHash_1 = require("./consistentHash");
class CacheManager {
    constructor() {
        this.nodeNames = Array.from({ length: config_1.config.cacheNodeCount }, (_, i) => `cache-node-${i}`);
        this.hashRing = new consistentHash_1.ConsistentHash(this.nodeNames, config_1.config.cacheVirtualNodes);
        this.nodes = this.nodeNames.map(() => new ioredis_1.default(config_1.config.redisUrl));
    }
    getRedis(nodeName) {
        const idx = this.nodeNames.indexOf(nodeName);
        return this.nodes[idx];
    }
    cacheKey(prefix, mode) {
        const p = prefix.toLowerCase();
        return mode ? `suggest:${mode}:${p}` : `suggest:${p}`;
    }
    async getSuggestions(prefix, mode) {
        const key = this.cacheKey(prefix, mode);
        const { node: nodeName } = this.hashRing.getNodeWithPosition(key);
        const redis = this.getRedis(nodeName);
        const cached = await redis.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
        return null;
    }
    async setSuggestions(prefix, results, mode) {
        const key = this.cacheKey(prefix, mode);
        const { node: nodeName } = this.hashRing.getNodeWithPosition(key);
        const redis = this.getRedis(nodeName);
        await redis.setex(key, config_1.config.cacheTtlSeconds, JSON.stringify(results));
    }
    async debug(prefix, mode) {
        const key = this.cacheKey(prefix, mode);
        const { node: nodeName, position } = this.hashRing.getNodeWithPosition(key);
        const redis = this.getRedis(nodeName);
        const cached = await redis.get(key);
        const cacheHit = cached !== null;
        const cachedResult = cacheHit ? JSON.parse(cached) : null;
        return {
            prefix,
            cache_node: nodeName,
            hash_ring_position: position,
            cache_hit: cacheHit,
            cached_result: cachedResult,
        };
    }
    async invalidatePrefix(prefix, mode) {
        const key = this.cacheKey(prefix, mode);
        const { node: nodeName } = this.hashRing.getNodeWithPosition(key);
        const redis = this.getRedis(nodeName);
        await redis.del(key);
    }
    logRouting(prefix, mode) {
        const key = this.cacheKey(prefix, mode);
        const { node, position } = this.hashRing.getNodeWithPosition(key);
        console.log(`[ConsistentHash] key="${key}" position=${position} → node="${node}"`);
    }
    async close() {
        await Promise.all(this.nodes.map((r) => r.quit()));
    }
}
exports.CacheManager = CacheManager;
exports.cacheManager = new CacheManager();
//# sourceMappingURL=cacheManager.js.map