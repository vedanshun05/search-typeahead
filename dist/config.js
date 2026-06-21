"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '3000', 10),
    databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/search_typeahead',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
    cacheNodeCount: parseInt(process.env.CACHE_NODE_COUNT || '3', 10),
    cacheVirtualNodes: parseInt(process.env.CACHE_VIRTUAL_NODES || '150', 10),
    batchFlushIntervalMs: parseInt(process.env.BATCH_FLUSH_INTERVAL_MS || '5000', 10),
    batchBufferSize: parseInt(process.env.BATCH_BUFFER_SIZE || '100', 10),
    trendingAlpha: parseFloat(process.env.TRENDING_ALPHA || '0.3'),
    trendingDecay: parseFloat(process.env.TRENDING_DECAY || '0.95'),
};
//# sourceMappingURL=config.js.map