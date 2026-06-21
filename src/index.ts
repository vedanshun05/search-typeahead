import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { pool } from './db/connection';
import { batchWriter } from './batch/batchWriter';
import apiRoutes from './routes/api';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/up', (_req, res) => {
  res.status(200).send('ok');
});

app.use('/api', apiRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

batchWriter.start();

app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════╗
║     Search Typeahead System (HLD101)     ║
║     Running on http://localhost:${config.port}      ║
╚══════════════════════════════════════════╝
  `);
  console.log(`  Cache nodes: ${config.cacheNodeCount}`);
  console.log(`  Virtual nodes per node: ${config.cacheVirtualNodes}`);
  console.log(`  Cache TTL: ${config.cacheTtlSeconds}s`);
  console.log(`  Batch flush interval: ${config.batchFlushIntervalMs}ms`);
  console.log(`  Trending alpha (recency weight): ${config.trendingAlpha}`);
  console.log(`  Trending decay: ${config.trendingDecay}`);
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
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await pool.end();
  process.exit(0);
});
