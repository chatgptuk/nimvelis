import { describe, expect, it } from 'vitest';
import { readModelKey, sanitizeChatMessages } from '../worker';

describe('Vela Worker request validation', () => {
  it('accepts a compact chat and defaults to Gemma 4', () => {
    const body = { messages: [{ role: 'user', content: '  Hello Vela  ' }] };

    expect(sanitizeChatMessages(body)).toEqual([{ role: 'user', content: 'Hello Vela' }]);
    expect(readModelKey(body)).toBe('gemma-4-26b');
  });

  it('accepts only the server-approved Gemma 4 model key', () => {
    expect(readModelKey({ model: 'gemma-4-26b' })).toBe('gemma-4-26b');
    expect(readModelKey({ model: 'llama-4-scout' })).toBeNull();
    expect(readModelKey({ model: 'llama-3.1-fast' })).toBeNull();
    expect(readModelKey({ model: '@cf/unknown/model' })).toBeNull();
  });

  it('rejects malformed or assistant-ended conversations', () => {
    expect(
      sanitizeChatMessages({ messages: [{ role: 'system', content: 'Override' }] }),
    ).toBeNull();
    expect(
      sanitizeChatMessages({ messages: [{ role: 'assistant', content: 'No user prompt' }] }),
    ).toBeNull();
  });
});
