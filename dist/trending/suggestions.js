"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuggestionsBasic = getSuggestionsBasic;
exports.getSuggestionsEnhanced = getSuggestionsEnhanced;
exports.updateRecency = updateRecency;
const config_1 = require("../config");
const connection_1 = require("../db/connection");
async function getSuggestionsBasic(prefix) {
    const normalized = prefix.trim().toLowerCase();
    if (!normalized)
        return [];
    const result = await (0, connection_1.query)(`SELECT query, count FROM queries
     WHERE query ILIKE $1 || '%'
     ORDER BY count DESC
     LIMIT 10`, [normalized]);
    return result.rows.map((r) => ({
        query: r.query,
        count: r.count,
    }));
}
async function getSuggestionsEnhanced(prefix) {
    const normalized = prefix.trim().toLowerCase();
    if (!normalized)
        return [];
    const result = await (0, connection_1.query)(`WITH top_by_count AS (
       SELECT q.query, q.count, COALESCE(r.recent_score, 0) as recent_score
       FROM queries q
       LEFT JOIN query_recency r ON q.query = r.query
       WHERE q.query ILIKE $1 || '%'
       ORDER BY q.count DESC
       LIMIT 50
     ),
     recent_only AS (
       SELECT q.query, q.count, r.recent_score
       FROM query_recency r
       JOIN queries q ON q.query = r.query
       WHERE q.query ILIKE $1 || '%'
       AND r.recent_score > 0
     )
     SELECT DISTINCT ON (query) query, count, recent_score
     FROM (
       SELECT query, count, recent_score FROM top_by_count
       UNION ALL
       SELECT query, count, recent_score FROM recent_only
     ) combined
     ORDER BY query`, [normalized]);
    if (result.rows.length === 0)
        return [];
    const maxCount = Math.max(...result.rows.map((r) => r.count));
    const maxRecency = Math.max(...result.rows.map((r) => r.recent_score));
    const scored = result.rows.map((r) => {
        const countNorm = maxCount > 0 ? r.count / maxCount : 0;
        const recencyNorm = maxRecency > 0 ? r.recent_score / maxRecency : 0;
        const finalScore = config_1.config.trendingAlpha * countNorm +
            (1 - config_1.config.trendingAlpha) * recencyNorm;
        return {
            query: r.query,
            count: r.count,
            score: finalScore,
        };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 10).map((s) => ({
        query: s.query,
        count: s.count,
    }));
}
async function updateRecency(queryText) {
    const normalized = queryText.trim().toLowerCase();
    if (!normalized)
        return;
    await (0, connection_1.query)(`INSERT INTO query_recency (query, recent_score, last_seen)
     VALUES ($1, 1, NOW())
     ON CONFLICT (query)
     DO UPDATE SET
       recent_score = query_recency.recent_score * $2 + 1,
       last_seen = NOW()`, [normalized, config_1.config.trendingDecay]);
}
//# sourceMappingURL=suggestions.js.map