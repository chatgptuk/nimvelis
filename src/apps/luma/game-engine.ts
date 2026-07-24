export type LumaDifficulty = 'pocket' | 'classic' | 'orbit';

export interface LumaDifficultyDefinition {
  id: LumaDifficulty;
  label: string;
  size: number;
  pulseCount: number;
  description: string;
}

export const LUMA_DIFFICULTIES: readonly LumaDifficultyDefinition[] = [
  {
    id: 'pocket',
    label: 'Pocket',
    size: 3,
    pulseCount: 4,
    description: 'A quick 3 × 3 constellation.',
  },
  {
    id: 'classic',
    label: 'Classic',
    size: 5,
    pulseCount: 9,
    description: 'The balanced 5 × 5 sky.',
  },
  {
    id: 'orbit',
    label: 'Orbit',
    size: 7,
    pulseCount: 15,
    description: 'A wide 7 × 7 challenge.',
  },
] as const;

export interface LumaPuzzle {
  board: boolean[];
  seed: number;
  size: number;
}

export function getLumaDifficulty(difficulty: LumaDifficulty): LumaDifficultyDefinition {
  return LUMA_DIFFICULTIES.find((candidate) => candidate.id === difficulty) ?? LUMA_DIFFICULTIES[1];
}

export function createLumaPuzzle(difficulty: LumaDifficulty, requestedSeed: number): LumaPuzzle {
  const definition = getLumaDifficulty(difficulty);
  const seed = normalizeSeed(requestedSeed);
  const random = createSeededRandom(seed);
  const selected = new Set<number>();
  const cellCount = definition.size * definition.size;

  while (selected.size < Math.min(definition.pulseCount, cellCount - 1)) {
    selected.add(Math.floor(random() * cellCount));
  }

  let board = Array<boolean>(cellCount).fill(false);
  for (const index of selected) {
    board = toggleLumaCell(board, definition.size, index);
  }

  if (isLumaSolved(board)) {
    board = toggleLumaCell(board, definition.size, Math.floor(cellCount / 2));
  }

  return { board, seed, size: definition.size };
}

export function toggleLumaCell(board: readonly boolean[], size: number, index: number): boolean[] {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= board.length ||
    board.length !== size * size
  ) {
    return [...board];
  }

  const next = [...board];
  const row = Math.floor(index / size);
  const column = index % size;
  const targets = [
    [row, column],
    [row - 1, column],
    [row + 1, column],
    [row, column - 1],
    [row, column + 1],
  ];

  for (const [targetRow, targetColumn] of targets) {
    if (
      targetRow === undefined ||
      targetColumn === undefined ||
      targetRow < 0 ||
      targetRow >= size ||
      targetColumn < 0 ||
      targetColumn >= size
    ) {
      continue;
    }
    const targetIndex = targetRow * size + targetColumn;
    next[targetIndex] = !next[targetIndex];
  }

  return next;
}

export function solveLumaBoard(board: readonly boolean[], size: number): number[] | null {
  if (board.length !== size * size || size < 1 || size > 10) return null;
  let best: number[] | null = null;
  const firstRowPossibilities = 2 ** size;

  for (let firstRowMask = 0; firstRowMask < firstRowPossibilities; firstRowMask += 1) {
    let working = [...board];
    const presses: number[] = [];

    for (let column = 0; column < size; column += 1) {
      if ((firstRowMask & (1 << column)) !== 0) {
        const index = column;
        working = toggleLumaCell(working, size, index);
        presses.push(index);
      }
    }

    for (let row = 1; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        const aboveIndex = (row - 1) * size + column;
        if (!working[aboveIndex]) continue;
        const index = row * size + column;
        working = toggleLumaCell(working, size, index);
        presses.push(index);
      }
    }

    if (isLumaSolved(working) && (best === null || presses.length < best.length)) {
      best = presses;
    }
  }

  return best;
}

export function isLumaSolved(board: readonly boolean[]): boolean {
  return board.every((cell) => !cell);
}

export function formatLumaTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function normalizeSeed(value: number) {
  if (!Number.isFinite(value)) return 1;
  const normalized = Math.abs(Math.floor(value)) >>> 0;
  return normalized || 1;
}
