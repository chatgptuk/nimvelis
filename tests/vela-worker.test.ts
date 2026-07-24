import { describe, expect, it } from 'vitest';
import { readModelKey, sanitizeChatMessages } from '../worker';

describe('Vela Worker request validation', () => {
  it('accepts a compact chat and defaults to the fast model', () => {
    const body = { messages: [{ role: 'user', content: '  Hello Vela  ' }] };

    expect(sanitizeChatMessages(body)).toEqual([{ role: 'user', content: 'Hello Vela' }]);
    expect(readModelKey(body)).toBe('llama-3.1-fast');
  });

  it('accepts only server-approved model keys', () => {
    expect(readModelKey({ model: 'llama-4-scout' })).toBe('llama-4-scout');
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
