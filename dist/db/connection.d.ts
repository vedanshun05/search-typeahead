import { Pool } from 'pg';
export declare const pool: Pool;
export declare function query(text: string, params?: any[]): Promise<{
    rows: any[];
    rowCount: number | null;
    duration: number;
}>;
//# sourceMappingURL=connection.d.ts.map