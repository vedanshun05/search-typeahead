declare class BatchWriter {
    private buffer;
    private timer;
    private totalWritesWithoutBatching;
    private totalBatchesFlushed;
    private totalWritesWithBatching;
    start(): void;
    increment(queryText: string): void;
    flush(): Promise<void>;
    getStats(): {
        totalWritesWithoutBatching: number;
        totalBatchesFlushed: number;
        totalWritesWithBatching: number;
        currentBufferSize: number;
        writeReductionPercent: string;
    };
    private flushAndExit;
}
export declare const batchWriter: BatchWriter;
export {};
//# sourceMappingURL=batchWriter.d.ts.map