import { describe, expect, it } from 'vitest';
import { Sha1Hasher } from './sha1-hasher';

describe('Sha1Hasher', () => {
  it('should_match_known_digest', () => {
    const hasher = new Sha1Hasher();
    hasher.update(new TextEncoder().encode('hello'));

    expect(hasher.digestBase64()).toBe('qvTGHdzF6KLavt4PO0gs2a6pQ00=');
  });

  it('should_match_digest_across_chunks', () => {
    const payload = new TextEncoder().encode('hello world');
    const single = new Sha1Hasher();
    single.update(payload);

    const chunked = new Sha1Hasher();
    chunked.update(payload.subarray(0, 5));
    chunked.update(payload.subarray(5));

    expect(chunked.digestBase64()).toBe(single.digestBase64());
  });
});
