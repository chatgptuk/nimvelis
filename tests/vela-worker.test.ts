import { describe, expect, it } from 'vitest';
import {
  GEMMA_CONTEXT_WINDOW_TOKENS,
  getVelaMaxCompletionTokens,
  readModelKey,
  sanitizeChatMessages,
} from '../worker';

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

  it('uses Gemma 4 remaining context as the completion budget', () => {
    expect(GEMMA_CONTEXT_WINDOW_TOKENS).toBe(256_000);
    expect(getVelaMaxCompletionTokens(0)).toBe(253_952);
    expect(getVelaMaxCompletionTokens(12_000)).toBe(241_952);
    expect(getVelaMaxCompletionTokens(48_000)).toBe(205_952);
  });
});
