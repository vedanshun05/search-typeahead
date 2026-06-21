import { SuggestResult, CacheDebugInfo } from '../types';
export declare class CacheManager {
    private nodes;
    private hashRing;
    private nodeNames;
    constructor();
    private getRedis;
    private cacheKey;
    getSuggestions(prefix: string, mode?: string): Promise<SuggestResult[] | null>;
    setSuggestions(prefix: string, results: SuggestResult[], mode?: string): Promise<void>;
    debug(prefix: string, mode?: string): Promise<CacheDebugInfo>;
    invalidatePrefix(prefix: string, mode?: string): Promise<void>;
    logRouting(prefix: string, mode?: string): void;
    close(): Promise<void>;
}
export declare const cacheManager: CacheManager;
//# sourceMappingURL=cacheManager.d.ts.map