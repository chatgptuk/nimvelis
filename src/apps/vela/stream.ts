export interface VelaStreamChunk {
  text: string;
  done: boolean;
}

export function consumeVelaStreamLine(line: string): VelaStreamChunk {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return { text: '', done: false };

  const data = trimmed.slice(5).trim();
  if (!data) return { text: '', done: false };
  if (data === '[DONE]') return { text: '', done: true };

  try {
    const parsed: unknown = JSON.parse(data);
    if (typeof parsed === 'string') return { text: parsed, done: false };
    if (isRecord(parsed) && typeof parsed.response === 'string') {
      return { text: parsed.response, done: false };
    }
    if (isRecord(parsed) && typeof parsed.text === 'string') {
      return { text: parsed.text, done: false };
    }
  } catch {
    return { text: data, done: false };
  }

  return { text: '', done: false };
}

export async function readVelaResponse(
  response: Response,
  onText: (text: string) => void,
): Promise<void> {
  if (!response.body) throw new Error('Workers AI returned an empty response.');

  const contentType = response.headers.get('Content-Type')?.toLowerCase() ?? '';
  if (!contentType.includes('text/event-stream')) {
    const payload = await response.text();
    if (!payload) throw new Error('Workers AI returned an empty response.');
    try {
      const parsed: unknown = JSON.parse(payload);
      if (isRecord(parsed) && typeof parsed.response === 'string') {
        onText(parsed.response);
        return;
      }
    } catch {
      // A plain-text response is still valid.
    }
    onText(payload);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const chunk = consumeVelaStreamLine(line);
      if (chunk.text) onText(chunk.text);
      if (chunk.done) return;
    }

    if (done) break;
  }

  if (buffer) {
    const chunk = consumeVelaStreamLine(buffer);
    if (chunk.text) onText(chunk.text);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
