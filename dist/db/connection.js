"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
const pg_1 = require("pg");
const config_1 = require("../config");
exports.pool = new pg_1.Pool({
    connectionString: config_1.config.databaseUrl,
});
exports.pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
    process.exit(1);
});
async function query(text, params) {
    const start = Date.now();
    const result = await exports.pool.query(text, params);
    const duration = Date.now() - start;
    return { rows: result.rows, rowCount: result.rowCount, duration };
}
//# sourceMappingURL=connection.js.map