"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
async function ingest(filePath) {
    console.log(`Ingesting dataset from: ${filePath}`);
    const fileStream = fs_1.default.createReadStream(filePath);
    const rl = readline_1.default.createInterface({ input: fileStream, crlfDelay: Infinity });
    let batch = [];
    const batchSize = 1000;
    let totalRows = 0;
    let headerSkipped = false;
    for await (const line of rl) {
        if (!headerSkipped) {
            headerSkipped = true;
            continue;
        }
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        const parts = trimmed.split('\t');
        if (parts.length < 2)
            continue;
        const queryText = parts[0].trim();
        const count = parseInt(parts[1].replace(/,/g, ''), 10);
        if (!queryText || isNaN(count))
            continue;
        batch.push({ query: queryText, count });
        totalRows++;
        if (batch.length >= batchSize) {
            await flushBatch(batch);
            batch = [];
        }
    }
    if (batch.length > 0) {
        await flushBatch(batch);
    }
    console.log(`\nIngestion complete. Imported ${totalRows} queries.`);
    process.exit(0);
}
async function flushBatch(batch) {
    const values = batch
        .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
        .join(', ');
    const params = [];
    for (const item of batch) {
        params.push(item.query, item.count);
    }
    const sql = `
    INSERT INTO queries (query, count)
    VALUES ${values}
    ON CONFLICT (query) DO UPDATE SET count = EXCLUDED.count
  `;
    try {
        await (0, connection_1.query)(sql, params);
        process.stdout.write('.');
    }
    catch (err) {
        console.error('\nBatch insert failed:', err);
    }
}
const fileArg = process.argv.find((a) => a.startsWith('--file='));
if (!fileArg) {
    console.error('Usage: npm run ingest -- --file=<path-to-tsv>');
    console.error('Expected format: TSV with columns: query<TAB>count');
    process.exit(1);
}
const filePath = fileArg.split('=')[1];
ingest(filePath).catch((err) => {
    console.error('Ingestion failed:', err);
    process.exit(1);
});
//# sourceMappingURL=ingest.js.map