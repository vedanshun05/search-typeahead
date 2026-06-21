import crypto from 'crypto';

interface RingNode {
  name: string;
  position: number;
}

export class ConsistentHash {
  private ring: RingNode[] = [];
  private virtualNodes: number;

  constructor(nodeNames: string[], virtualNodes: number = 150) {
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

  private hash(key: string): number {
    const sha1 = crypto.createHash('sha1').update(key).digest();
    return sha1.readUInt32BE(0);
  }

  getNode(key: string): string {
    if (this.ring.length === 0) return 'no-nodes';

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
      } else {
        high = mid;
      }
    }

    return this.ring[low].name;
  }

  getNodeWithPosition(key: string): { node: string; position: number } {
    const position = this.hash(key);
    return { node: this.getNode(key), position };
  }

  getRingSize(): number {
    return this.ring.length;
  }
}
