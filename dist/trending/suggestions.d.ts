import { SuggestResult } from '../types';
export declare function getSuggestionsBasic(prefix: string): Promise<SuggestResult[]>;
export declare function getSuggestionsEnhanced(prefix: string): Promise<SuggestResult[]>;
export declare function updateRecency(queryText: string): Promise<void>;
//# sourceMappingURL=suggestions.d.ts.map