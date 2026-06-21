"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsistentHash = void 0;
const crypto_1 = __importDefault(require("crypto"));
class ConsistentHash {
    constructor(nodeNames, virtualNodes = 150) {
        this.ring = [];
        this.virtualNodes = virtualNodes;
        for (const nodeName of nodeNames) {
            for (let i = 0; i < virtualNodes; i++) {
                const virtualKey = `${nodeName}:v${i}`;
                const position = this.hash(virtualKey);
                this.ring.push({ name: nodeName, position });
            }
        }
        this.ring.sort((a, b) => a.position - b.position);
    }
    hash(key) {
        const sha1 = crypto_1.default.createHash('sha1').update(key).digest();
        return sha1.readUInt32BE(0);
    }
    getNode(key) {
        if (this.ring.length === 0)
            return 'no-nodes';
        const position = this.hash(key);
        let low = 0;
        let high = this.ring.length - 1;
        if (position > this.ring[high].position || position <= this.ring[0].position) {
            return this.ring[0].name;
        }
        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (this.ring[mid].position < position) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return this.ring[low].name;
    }
    getNodeWithPosition(key) {
        const position = this.hash(key);
        return { node: this.getNode(key), position };
    }
    getRingSize() {
        return this.ring.length;
    }
}
exports.ConsistentHash = ConsistentHash;
//# sourceMappingURL=consistentHash.js.map