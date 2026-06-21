"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cacheManager_1 = require("../cache/cacheManager");
const suggestions_1 = require("../trending/suggestions");
const batchWriter_1 = require("../batch/batchWriter");
const router = (0, express_1.Router)();
router.get('/suggest', async (req, res) => {
    const prefix = req.query.q || '';
    const mode = req.query.mode || 'enhanced';
    const start = Date.now();
    try {
        cacheManager_1.cacheManager.logRouting(prefix, mode);
        const cached = await cacheManager_1.cacheManager.getSuggestions(prefix, mode);
        let results;
        if (cached) {
            results = cached;
        }
        else {
            results =
                mode === 'basic'
                    ? await (0, suggestions_1.getSuggestionsBasic)(prefix)
                    : await (0, suggestions_1.getSuggestionsEnhanced)(prefix);
            await cacheManager_1.cacheManager.setSuggestions(prefix, results, mode);
        }
        const latency = Date.now() - start;
        res.json({
            prefix,
            suggestions: results,
            mode,
            latency_ms: latency,
            cache_hit: cached !== null,
        });
    }
    catch (err) {
        console.error('[Suggest] Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/search', async (req, res) => {
    const { query: searchQuery } = req.body;
    if (!searchQuery || typeof searchQuery !== 'string') {
        res.status(400).json({ error: 'Missing or invalid "query" field' });
        return;
    }
    try {
        const normalized = searchQuery.trim().toLowerCase();
        batchWriter_1.batchWriter.increment(normalized);
        await (0, suggestions_1.updateRecency)(normalized);
        console.log(`[Search] Submitted: "${normalized}"`);
        res.json({ message: 'Searched' });
    }
    catch (err) {
        console.error('[Search] Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/cache/debug', async (req, res) => {
    const prefix = req.query.prefix || '';
    const mode = req.query.mode || undefined;
    if (!prefix) {
        res.status(400).json({ error: 'Missing "prefix" query parameter' });
        return;
    }
    try {
        const debugInfo = await cacheManager_1.cacheManager.debug(prefix, mode);
        res.json(debugInfo);
    }
    catch (err) {
        console.error('[CacheDebug] Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/performance', async (_req, res) => {
    const stats = batchWriter_1.batchWriter.getStats();
    res.json({
        batch_writes: stats,
    });
});
router.get('/up', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
exports.default = router;
//# sourceMappingURL=api.js.map