const DEFAULT_VELA_MODEL = 'gemma-4-26b';
const VELA_MODELS = {
  'gemma-4-26b': '@cf/google/gemma-4-26b-a4b-it',
} as const;
const MAX_REQUEST_BODY_BYTES = 3_600_000;
const MAX_TEXT_BYTES = 48_000;
const MAX_IMAGE_BYTES = 2_500_000;
const MAX_MESSAGES = 18;
const MAX_MESSAGE_CHARACTERS = 6_000;
const REQUESTS_PER_MINUTE = 12;
const AI_START_TIMEOUT_MS = 45_000;
export const GEMMA_CONTEXT_WINDOW_TOKENS = 256_000;
const VELA_COMPLETION_RESERVE_TOKENS = 2_048;
const VELA_IMAGE_TOKEN_RESERVE = 32_768;

const VELA_SYSTEM_PROMPT = [
  'You are Vela, the concise, thoughtful text assistant built into Nimvelis Aurora.',
  'Help with writing, planning, explanation, brainstorming, and everyday questions.',
  'Use clear plain language and short structure unless the user asks for more detail.',
  'When the user attaches an image, analyze only that explicitly provided image and say when a detail is uncertain.',
  'Never claim that you can see local files, windows, device data, or previous conversations unless the user included that information in the chat.',
  'If a request is ambiguous, make a reasonable assumption and state it briefly.',
].join(' ');

type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatImage {
  dataUrl: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  byteLength: number;
}

type WorkersAiContentPart =
  | { type: 'text'; text: string }
  | {
      type: 'image_url';
      image_url: {
        url: string;
        detail: 'auto';
      };
    };

interface WorkersAiMessage {
  role: 'system' | ChatRole;
  content: string | WorkersAiContentPart[];
}

interface WorkersAiBinding {
  run(
    model: string,
    input: {
      messages: WorkersAiMessage[];
      stream: true;
      max_completion_tokens: number;
    },
  ): Promise<ReadableStream<Uint8Array>>;
}

interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  AI: WorkersAiBinding;
  ASSETS: AssetsBinding;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/vela/chat') {
      return handleVelaChat(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return jsonError('Unknown Nimvelis API route.', 404);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleVelaChat(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(null, {
      status: 405,
      headers: { Allow: 'POST' },
    });
  }

  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return jsonError('Cross-origin requests are not accepted.', 403);
  }

  if (!request.headers.get('Content-Type')?.toLowerCase().includes('application/json')) {
    return jsonError('Send a JSON request body.', 415);
  }

  const declaredLength = Number(request.headers.get('Content-Length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BODY_BYTES) {
    return jsonError('This conversation is too large.', 413);
  }

  const rateLimit = takeRateLimit(request);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Vela is receiving too many messages. Try again shortly.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'Retry-After': String(rateLimit.retryAfter),
        },
      },
    );
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return jsonError('The request body could not be read.', 400);
  }
  const bodyBytes = new TextEncoder().encode(text).byteLength;
  if (bodyBytes > MAX_REQUEST_BODY_BYTES) {
    return jsonError('This conversation is too large.', 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return jsonError('The request body is not valid JSON.', 400);
  }

  const messages = sanitizeChatMessages(body);
  if (!messages) {
    return jsonError('Include 1–18 valid user or assistant messages.', 400);
  }
  const textBytes = getChatTextBytes(messages);
  if (textBytes > MAX_TEXT_BYTES) {
    return jsonError('This conversation contains too much text.', 413);
  }
  const image = sanitizeChatImage(body);
  if (isRecord(body) && body.image !== undefined && !image) {
    return jsonError('Attach one valid PNG, JPEG, or WebP image up to 2.5 MB.', 400);
  }
  const modelKey = readModelKey(body);
  if (!modelKey) {
    return jsonError('Gemma 4 is the only supported Vela model.', 400);
  }
  const model = VELA_MODELS[modelKey];

  try {
    const stream = await withTimeout(
      env.AI.run(model, {
        messages: buildWorkersAiMessages(messages, image),
        stream: true,
        max_completion_tokens: getVelaMaxCompletionTokens(textBytes, Boolean(image)),
      }),
      AI_START_TIMEOUT_MS,
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Nimvelis-AI-Model': model,
      },
    });
  } catch (error) {
    console.error('Vela Workers AI request failed', error);
    return jsonError('Workers AI is temporarily unavailable. Please try again.', 503);
  }
}

export function sanitizeChatMessages(body: unknown): ChatMessage[] | null {
  if (!isRecord(body) || !Array.isArray(body.messages)) return null;
  if (body.messages.length < 1 || body.messages.length > MAX_MESSAGES) return null;

  const messages = body.messages.flatMap((candidate): ChatMessage[] => {
    if (!isRecord(candidate)) return [];
    if (candidate.role !== 'user' && candidate.role !== 'assistant') return [];
    if (typeof candidate.content !== 'string') return [];
    const content = candidate.content.trim();
    if (!content || content.length > MAX_MESSAGE_CHARACTERS) return [];
    return [{ role: candidate.role, content }];
  });

  if (messages.length !== body.messages.length) return null;
  if (messages.at(-1)?.role !== 'user') return null;
  return messages;
}

export function readModelKey(body: unknown): keyof typeof VELA_MODELS | null {
  if (!isRecord(body)) return null;
  if (body.model === undefined) return DEFAULT_VELA_MODEL;
  if (typeof body.model !== 'string' || !(body.model in VELA_MODELS)) return null;
  return body.model as keyof typeof VELA_MODELS;
}

export function sanitizeChatImage(body: unknown): ChatImage | null {
  if (!isRecord(body) || !isRecord(body.image) || typeof body.image.dataUrl !== 'string') {
    return null;
  }

  const match = body.image.dataUrl.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/,
  );
  if (!match) return null;
  const mimeType = match[1] as ChatImage['mimeType'];
  const encoded = match[2];
  if (!encoded || encoded.length % 4 !== 0) return null;
  const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0;
  const byteLength = (encoded.length / 4) * 3 - padding;
  if (byteLength < 1 || byteLength > MAX_IMAGE_BYTES) return null;

  return { dataUrl: body.image.dataUrl, mimeType, byteLength };
}

export function buildWorkersAiMessages(
  messages: ChatMessage[],
  image: ChatImage | null,
): WorkersAiMessage[] {
  const aiMessages: WorkersAiMessage[] = [
    { role: 'system', content: VELA_SYSTEM_PROMPT },
    ...messages.map(({ role, content }) => ({ role, content })),
  ];
  if (!image) return aiMessages;

  const lastMessage = aiMessages.at(-1);
  if (!lastMessage || lastMessage.role !== 'user' || typeof lastMessage.content !== 'string') {
    return aiMessages;
  }
  lastMessage.content = [
    { type: 'text', text: lastMessage.content },
    {
      type: 'image_url',
      image_url: {
        url: image.dataUrl,
        detail: 'auto',
      },
    },
  ];
  return aiMessages;
}

export function getVelaMaxCompletionTokens(requestTextBytes: number, hasImage = false): number {
  const conservativePromptTokens = Math.min(
    MAX_TEXT_BYTES,
    Math.max(0, Math.floor(requestTextBytes)),
  );

  return Math.max(
    1,
    GEMMA_CONTEXT_WINDOW_TOKENS -
      conservativePromptTokens -
      VELA_COMPLETION_RESERVE_TOKENS -
      (hasImage ? VELA_IMAGE_TOKEN_RESERVE : 0),
  );
}

function getChatTextBytes(messages: ChatMessage[]): number {
  return new TextEncoder().encode(messages.map((message) => message.content).join('\n')).byteLength;
}

function takeRateLimit(request: Request): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (rateLimits.size > 1_024) {
    for (const [candidate, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(candidate);
    }
    if (rateLimits.size > 1_024) rateLimits.delete(rateLimits.keys().next().value ?? '');
  }
  const key = request.headers.get('CF-Connecting-IP') ?? 'local-development';
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Workers AI start timed out')), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
