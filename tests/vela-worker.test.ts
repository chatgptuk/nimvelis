import { describe, expect, it } from 'vitest';
import {
  buildWorkersAiMessages,
  GEMMA_CONTEXT_WINDOW_TOKENS,
  getVelaMaxCompletionTokens,
  readModelKey,
  sanitizeChatImage,
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
    expect(getVelaMaxCompletionTokens(12_000, true)).toBe(209_184);
  });

  it('validates an attached image and adds it only to the latest user turn', () => {
    const image = sanitizeChatImage({
      image: { dataUrl: 'data:image/png;base64,iVBORw0KGgo=' },
    });
    expect(image).toMatchObject({ mimeType: 'image/png', byteLength: 8 });

    const messages = buildWorkersAiMessages(
      [
        { role: 'assistant', content: 'What would you like to inspect?' },
        { role: 'user', content: 'Describe the colors.' },
      ],
      image,
    );

    expect(messages.at(-1)).toEqual({
      role: 'user',
      content: [
        { type: 'text', text: 'Describe the colors.' },
        {
          type: 'image_url',
          image_url: {
            url: 'data:image/png;base64,iVBORw0KGgo=',
            detail: 'auto',
          },
        },
      ],
    });
    expect(messages.at(-2)?.content).toBe('What would you like to inspect?');
  });

  it('rejects malformed or unsupported image data', () => {
    expect(
      sanitizeChatImage({ image: { dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' } }),
    ).toBeNull();
    expect(
      sanitizeChatImage({ image: { dataUrl: 'data:image/png;base64,not base64' } }),
    ).toBeNull();
  });
});
