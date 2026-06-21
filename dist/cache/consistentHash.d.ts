export declare class ConsistentHash {
    private ring;
    private virtualNodes;
    constructor(nodeNames: string[], virtualNodes?: number);
    private hash;
    getNode(key: string): string;
    getNodeWithPosition(key: string): {
        node: string;
        position: number;
    };
    getRingSize(): number;
}
//# sourceMappingURL=consistentHash.d.ts.map