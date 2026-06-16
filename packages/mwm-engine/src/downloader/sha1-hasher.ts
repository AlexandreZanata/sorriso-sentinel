/** Incremental SHA-1 hasher; digest format matches CoMaps `sha1_base64`. */
export class Sha1Hasher {
  private state = new Uint32Array([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]);
  private buffer = new Uint8Array(64);
  private bufferLength = 0;
  private totalBytes = 0;

  update(chunk: Uint8Array): void {
    this.totalBytes += chunk.length;
    this.appendBytes(chunk);
  }

  digestBase64(): string {
    const messageBytes = this.totalBytes;
    const bitLength = BigInt(messageBytes) * 8n;
    const padding = new Uint8Array(64);
    padding[0] = 0x80;

    const padLength = this.bufferLength < 56 ? 56 - this.bufferLength : 120 - this.bufferLength;
    this.appendBytes(padding.subarray(0, 1));
    this.appendBytes(new Uint8Array(padLength - 1));

    const lengthView = new DataView(new ArrayBuffer(8));
    lengthView.setUint32(0, Number((bitLength >> 32n) & 0xffffffffn));
    lengthView.setUint32(4, Number(bitLength & 0xffffffffn));
    this.appendBytes(new Uint8Array(lengthView.buffer));

    const output = new Uint8Array(20);

    for (let index = 0; index < 5; index += 1) {
      output[index * 4] = (this.state[index]! >>> 24) & 0xff;
      output[index * 4 + 1] = (this.state[index]! >>> 16) & 0xff;
      output[index * 4 + 2] = (this.state[index]! >>> 8) & 0xff;
      output[index * 4 + 3] = this.state[index]! & 0xff;
    }

    return uint8ArrayToBase64(output);
  }

  private appendBytes(chunk: Uint8Array): void {
    let offset = 0;

    while (offset < chunk.length) {
      const space = 64 - this.bufferLength;
      const take = Math.min(space, chunk.length - offset);
      this.buffer.set(chunk.subarray(offset, offset + take), this.bufferLength);
      this.bufferLength += take;
      offset += take;

      if (this.bufferLength === 64) {
        this.processBlock(this.buffer);
        this.bufferLength = 0;
      }
    }
  }

  private processBlock(block: Uint8Array): void {
    const words = new Uint32Array(80);

    for (let index = 0; index < 16; index += 1) {
      words[index] =
        (block[index * 4]! << 24) |
        (block[index * 4 + 1]! << 16) |
        (block[index * 4 + 2]! << 8) |
        block[index * 4 + 3]!;
    }

    for (let index = 16; index < 80; index += 1) {
      words[index] = rotateLeft(
        words[index - 3]! ^ words[index - 8]! ^ words[index - 14]! ^ words[index - 16]!,
        1,
      );
    }

    let a = this.state[0]!;
    let b = this.state[1]!;
    let c = this.state[2]!;
    let d = this.state[3]!;
    let e = this.state[4]!;

    for (let index = 0; index < 80; index += 1) {
      let f = 0;
      let k = 0;

      if (index < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (index < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (index < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotateLeft(a, 5) + f + e + k + words[index]!) >>> 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = temp;
    }

    this.state[0] = (this.state[0]! + a) >>> 0;
    this.state[1] = (this.state[1]! + b) >>> 0;
    this.state[2] = (this.state[2]! + c) >>> 0;
    this.state[3] = (this.state[3]! + d) >>> 0;
    this.state[4] = (this.state[4]! + e) >>> 0;
  }
}

function rotateLeft(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  if (typeof btoa === 'function') {
    return btoa(binary);
  }

  return Buffer.from(bytes).toString('base64');
}
