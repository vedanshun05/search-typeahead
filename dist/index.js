"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const connection_1 = require("./db/connection");
const batchWriter_1 = require("./batch/batchWriter");
const api_1 = __importDefault(require("./routes/api"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.get('/up', (_req, res) => {
    res.status(200).send('ok');
});
app.use('/api', api_1.default);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
batchWriter_1.batchWriter.start();
app.listen(config_1.config.port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║     Search Typeahead System (HLD101)     ║
║     Running on http://localhost:${config_1.config.port}      ║
╚══════════════════════════════════════════╝
  `);
    console.log(`  Cache nodes: ${config_1.config.cacheNodeCount}`);
    console.log(`  Virtual nodes per node: ${config_1.config.cacheVirtualNodes}`);
    console.log(`  Cache TTL: ${config_1.config.cacheTtlSeconds}s`);
    console.log(`  Batch flush interval: ${config_1.config.batchFlushIntervalMs}ms`);
    console.log(`  Trending alpha (recency weight): ${config_1.config.trendingAlpha}`);
    console.log(`  Trending decay: ${config_1.config.trendingDecay}`);
    console.log('');
    console.log('  APIs:');
    console.log(`  GET  /api/suggest?q=<prefix>  - Typeahead suggestions`);
    console.log(`  POST /api/search              - Submit search`);
    console.log(`  GET  /api/cache/debug?prefix= - Debug cache routing`);
    console.log(`  GET  /api/performance          - Batch write stats`);
    console.log(`  GET  /api/health               - Health check`);
    console.log('');
});
process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await connection_1.pool.end();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await connection_1.pool.end();
    process.exit(0);
});
//# sourceMappingURL=index.js.map