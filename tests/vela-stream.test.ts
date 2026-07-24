import { describe, expect, it, vi } from 'vitest';
import { consumeVelaStreamLine, extractVelaText, readVelaResponse } from '../src/apps/vela/stream';

describe('Vela stream reader', () => {
  it('reads Workers AI response events and the done marker', () => {
    expect(consumeVelaStreamLine('data: {"response":"Hello"}')).toEqual({
      text: 'Hello',
      done: false,
    });
    expect(consumeVelaStreamLine('data: [DONE]')).toEqual({ text: '', done: true });
  });

  it('reads visible Gemma deltas without exposing reasoning content', () => {
    expect(
      consumeVelaStreamLine(
        'data: {"choices":[{"delta":{"content":"Aurora","reasoning_content":null}}]}',
      ),
    ).toEqual({
      text: 'Aurora',
      done: false,
    });
    expect(
      consumeVelaStreamLine(
        'data: {"choices":[{"delta":{"reasoning_content":"internal reasoning"}}]}',
      ),
    ).toEqual({
      text: '',
      done: false,
    });
  });

  it('reads non-streaming OpenAI-compatible content', () => {
    expect(
      extractVelaText({
        choices: [{ message: { content: 'Aurora' } }],
      }),
    ).toBe('Aurora');
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

  it('joins the OpenAI-compatible stream shape returned by Gemma', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode('data: {"choices":[{"delta":{"reasoning_content":"think"}}]}\n\n'),
        );
        controller.enqueue(
          encoder.encode(
            'data: {"choices":[{"delta":{"content":"AUR","reasoning_content":null}}]}\n\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            'data: {"choices":[{"delta":{"content":"ORA","reasoning_content":null}}]}\n\n',
          ),
        );
        controller.enqueue(
          encoder.encode('data: {"response":"","usage":{"prompt_tokens":12}}\n\n'),
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    const onText = vi.fn();

    await readVelaResponse(
      new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }),
      onText,
    );

    expect(onText.mock.calls.flat().join('')).toBe('AURORA');
  });
});
