import { config } from '../config';
import { query as dbQuery } from '../db/connection';
import { SuggestResult } from '../types';

export async function getSuggestionsBasic(prefix: string): Promise<SuggestResult[]> {
  const normalized = prefix.trim().toLowerCase();

  if (!normalized) return [];

  const result = await dbQuery(
    `SELECT query, count FROM queries
     WHERE query ILIKE $1 || '%'
     ORDER BY count DESC
     LIMIT 10`,
    [normalized]
  );

  return result.rows.map((r) => ({
    query: r.query,
    count: r.count,
  }));
}

export async function getSuggestionsEnhanced(prefix: string): Promise<SuggestResult[]> {
  const normalized = prefix.trim().toLowerCase();

  if (!normalized) return [];

  const result = await dbQuery(
    `WITH top_by_count AS (
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
     ORDER BY query`,
    [normalized]
  );

  if (result.rows.length === 0) return [];

  const maxCount = Math.max(...result.rows.map((r) => r.count));
  const maxRecency = Math.max(...result.rows.map((r) => r.recent_score));

  const scored = result.rows.map((r) => {
    const countNorm = maxCount > 0 ? r.count / maxCount : 0;
    const recencyNorm = maxRecency > 0 ? r.recent_score / maxRecency : 0;

    const finalScore =
      config.trendingAlpha * countNorm +
      (1 - config.trendingAlpha) * recencyNorm;

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

export async function updateRecency(queryText: string): Promise<void> {
  const normalized = queryText.trim().toLowerCase();
  if (!normalized) return;

  await dbQuery(
    `INSERT INTO query_recency (query, recent_score, last_seen)
     VALUES ($1, 1, NOW())
     ON CONFLICT (query)
     DO UPDATE SET
       recent_score = query_recency.recent_score * $2 + 1,
       last_seen = NOW()`,
    [normalized, config.trendingDecay]
  );
}
