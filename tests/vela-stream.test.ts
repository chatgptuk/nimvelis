import { describe, expect, it, vi } from 'vitest';
import { consumeVelaStreamLine, readVelaResponse } from '../src/apps/vela/stream';

describe('Vela stream reader', () => {
  it('reads Workers AI response events and the done marker', () => {
    expect(consumeVelaStreamLine('data: {"response":"Hello"}')).toEqual({
      text: 'Hello',
      done: false,
    });
    expect(consumeVelaStreamLine('data: [DONE]')).toEqual({ text: '', done: true });
  });

  it('joins streamed SSE chunks', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"response":"Aur'));
        controller.enqueue(encoder.encode('ora"}\n\ndata: {"response":" ready"}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    const onText = vi.fn();

    await readVelaResponse(
      new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }),
      onText,
    );

    expect(onText.mock.calls.flat()).toEqual(['Aurora', ' ready']);
  });
});
