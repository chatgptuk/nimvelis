import { describe, expect, it } from 'vitest';
import {
  createLumaPuzzle,
  isLumaSolved,
  LUMA_DIFFICULTIES,
  solveLumaBoard,
  toggleLumaCell,
} from '../src/apps/luma/game-engine';

describe('Luma game engine', () => {
  it('pulses the selected cell and its orthogonal neighbours', () => {
    const board = Array<boolean>(9).fill(false);

    expect(toggleLumaCell(board, 3, 4)).toEqual([
      false,
      true,
      false,
      true,
      true,
      true,
      false,
      true,
      false,
    ]);
    expect(board.every((cell) => !cell)).toBe(true);
  });

  it('keeps edge pulses inside the board', () => {
    const board = toggleLumaCell(Array<boolean>(9).fill(false), 3, 0);
    expect(board.filter(Boolean)).toHaveLength(3);
    expect(board[0]).toBe(true);
    expect(board[1]).toBe(true);
    expect(board[3]).toBe(true);
  });

  it('creates deterministic, unsolved, solvable puzzles for every difficulty', () => {
    for (const difficulty of LUMA_DIFFICULTIES) {
      const first = createLumaPuzzle(difficulty.id, 42);
      const second = createLumaPuzzle(difficulty.id, 42);
      expect(first).toEqual(second);
      expect(isLumaSolved(first.board)).toBe(false);

      const solution = solveLumaBoard(first.board, first.size);
      expect(solution).not.toBeNull();
      const solved = solution?.reduce(
        (board, index) => toggleLumaCell(board, first.size, index),
        first.board,
      );
      expect(isLumaSolved(solved ?? [])).toBe(true);
    }
  });

  it('returns an empty solution for an already quiet sky', () => {
    expect(solveLumaBoard(Array<boolean>(25).fill(false), 5)).toEqual([]);
  });
});
