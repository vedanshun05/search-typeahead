import { Router, Request, Response } from 'express';
import { cacheManager } from '../cache/cacheManager';
import { getSuggestionsBasic, getSuggestionsEnhanced, updateRecency } from '../trending/suggestions';
import { batchWriter } from '../batch/batchWriter';

const router = Router();

router.get('/suggest', async (req: Request, res: Response) => {
  const prefix = (req.query.q as string) || '';
  const mode = (req.query.mode as string) || 'enhanced';
  const start = Date.now();

  try {
    cacheManager.logRouting(prefix, mode);

    const cached = await cacheManager.getSuggestions(prefix, mode);
    let results;

    if (cached) {
      results = cached;
    } else {
      results =
        mode === 'basic'
          ? await getSuggestionsBasic(prefix)
          : await getSuggestionsEnhanced(prefix);

      await cacheManager.setSuggestions(prefix, results, mode);
    }

    const latency = Date.now() - start;

    res.json({
      prefix,
      suggestions: results,
      mode,
      latency_ms: latency,
      cache_hit: cached !== null,
    });
  } catch (err) {
    console.error('[Suggest] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/search', async (req: Request, res: Response) => {
  const { query: searchQuery } = req.body;

  if (!searchQuery || typeof searchQuery !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "query" field' });
    return;
  }

  try {
    const normalized = searchQuery.trim().toLowerCase();
    batchWriter.increment(normalized);
    await updateRecency(normalized);

    cacheManager.invalidateAllPrefixes(normalized).catch((err) => {
      console.error('[Search] Cache invalidation error:', err);
    });

    console.log(`[Search] Submitted: "${normalized}"`);

    res.json({ message: 'Searched' });
  } catch (err) {
    console.error('[Search] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cache/debug', async (req: Request, res: Response) => {
  const prefix = (req.query.prefix as string) || '';
  const mode = (req.query.mode as string) || 'enhanced';

  if (!prefix) {
    res.status(400).json({ error: 'Missing "prefix" query parameter' });
    return;
  }

  try {
    const debugInfo = await cacheManager.debug(prefix, mode);
    res.json(debugInfo);
  } catch (err) {
    console.error('[CacheDebug] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/performance', async (_req: Request, res: Response) => {
  const stats = batchWriter.getStats();
  res.json({
    batch_writes: stats,
  });
});

router.get('/up', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

export default router;
