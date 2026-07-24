import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { Icon } from '../../design/Icon';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import {
  createLumaPuzzle,
  formatLumaTime,
  getLumaDifficulty,
  isLumaSolved,
  LUMA_DIFFICULTIES,
  solveLumaBoard,
  toggleLumaCell,
  type LumaDifficulty,
} from './game-engine';
import './luma.css';

interface BestRecord {
  moves: number;
  seconds: number;
}

type BestRecords = Partial<Record<LumaDifficulty, BestRecord>>;
type GameStatus = 'playing' | 'paused' | 'won';

const BEST_RECORDS_KEY = 'nimvelis.luma.best.v1';

export function LumaApp({ system }: SystemAppProps) {
  const [difficulty, setDifficulty] = useState<LumaDifficulty>('classic');
  const [puzzle, setPuzzle] = useState(() => createLumaPuzzle('classic', createSeed()));
  const [board, setBoard] = useState(puzzle.board);
  const [history, setHistory] = useState<boolean[][]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [assisted, setAssisted] = useState(false);
  const [bestRecords, setBestRecords] = useState<BestRecords>(readBestRecords);
  const boardRef = useRef<HTMLDivElement>(null);
  const definition = getLumaDifficulty(difficulty);
  const best = bestRecords[difficulty];
  const litCount = useMemo(() => board.filter(Boolean).length, [board]);

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = globalThis.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => globalThis.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setStatus((current) => (current === 'playing' ? 'paused' : current));
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);

  const startRound = (nextDifficulty: LumaDifficulty, seed = createSeed()) => {
    const nextPuzzle = createLumaPuzzle(nextDifficulty, seed);
    setDifficulty(nextDifficulty);
    setPuzzle(nextPuzzle);
    setBoard(nextPuzzle.board);
    setHistory([]);
    setMoves(0);
    setSeconds(0);
    setStatus('playing');
    setHintIndex(null);
    setAssisted(false);
    globalThis.setTimeout(() => focusCell(0), 0);
  };

  const restartRound = () => {
    setBoard(puzzle.board);
    setHistory([]);
    setMoves(0);
    setSeconds(0);
    setStatus('playing');
    setHintIndex(null);
    setAssisted(false);
    focusCell(0);
  };

  const pressCell = (index: number) => {
    if (status !== 'playing') return;
    const nextBoard = toggleLumaCell(board, definition.size, index);
    const nextMoves = moves + 1;
    setHistory((states) => [...states, board]);
    setBoard(nextBoard);
    setMoves(nextMoves);
    setHintIndex(null);

    if (!isLumaSolved(nextBoard)) return;
    setStatus('won');

    if (!assisted && isBetterRecord({ moves: nextMoves, seconds }, best)) {
      const nextRecords = {
        ...bestRecords,
        [difficulty]: { moves: nextMoves, seconds },
      };
      setBestRecords(nextRecords);
      persistBestRecords(nextRecords);
      system.notify('New Luma record saved on this device', 'success');
    } else {
      system.notify('Constellation cleared', 'success');
    }
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setBoard(previous);
    setHistory((states) => states.slice(0, -1));
    setMoves((value) => Math.max(0, value - 1));
    setStatus('playing');
    setHintIndex(null);
  };

  const showHint = () => {
    const solution = solveLumaBoard(board, definition.size);
    const nextHint = solution?.[0];
    if (nextHint === undefined) return;
    setHintIndex(nextHint);
    setAssisted(true);
    focusCell(nextHint);
  };

  const focusCell = (index: number) => {
    const cells = boardRef.current?.querySelectorAll<HTMLButtonElement>('[data-luma-cell]');
    cells?.[index]?.focus();
  };

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const row = Math.floor(index / definition.size);
    const column = index % definition.size;
    let nextRow = row;
    let nextColumn = column;

    if (event.key === 'ArrowUp') nextRow = Math.max(0, row - 1);
    else if (event.key === 'ArrowDown') nextRow = Math.min(definition.size - 1, row + 1);
    else if (event.key === 'ArrowLeft') nextColumn = Math.max(0, column - 1);
    else if (event.key === 'ArrowRight') nextColumn = Math.min(definition.size - 1, column + 1);
    else return;

    event.preventDefault();
    focusCell(nextRow * definition.size + nextColumn);
  };

  return (
    <div className="luma-app" data-game-status={status}>
      <header className="luma-header">
        <div className="luma-title">
          <span className="luma-title__mark">
            <Icon name="luma" size={25} />
          </span>
          <span>
            <strong>Luma</strong>
            <small>Quiet constellation puzzle</small>
          </span>
        </div>
        <button
          type="button"
          className="luma-pause"
          onClick={() =>
            setStatus((current) =>
              current === 'paused' ? 'playing' : current === 'playing' ? 'paused' : current,
            )
          }
          disabled={status === 'won'}
          aria-label={status === 'paused' ? 'Resume game' : 'Pause game'}
        >
          <span>{status === 'paused' ? '▶' : 'Ⅱ'}</span>
          {status === 'paused' ? 'Resume' : 'Pause'}
        </button>
      </header>

      <main className="luma-main">
        <section className="luma-panel" aria-label="Luma game controls">
          <div className="luma-difficulty" aria-label="Difficulty">
            {LUMA_DIFFICULTIES.map((option) => (
              <button
                type="button"
                key={option.id}
                className={option.id === difficulty ? 'is-active' : ''}
                aria-pressed={option.id === difficulty}
                onClick={() => startRound(option.id)}
              >
                <strong>{option.label}</strong>
                <small>
                  {option.size} × {option.size}
                </small>
              </button>
            ))}
          </div>

          <div className="luma-stats" aria-label="Game statistics">
            <article>
              <span>Moves</span>
              <strong>{String(moves).padStart(2, '0')}</strong>
            </article>
            <article>
              <span>Time</span>
              <strong>{formatLumaTime(seconds)}</strong>
            </article>
            <article>
              <span>Best</span>
              <strong>{best ? `${best.moves} / ${formatLumaTime(best.seconds)}` : '—'}</strong>
            </article>
          </div>

          <div className="luma-mission">
            <span>{assisted ? 'PRACTICE ROUND' : `CONSTELLATION ${shortSeed(puzzle.seed)}`}</span>
            <strong>Quiet every light.</strong>
            <p>
              Each pulse changes one star and its four neighbours. {litCount} light
              {litCount === 1 ? '' : 's'} remain.
            </p>
          </div>

          <div className="luma-actions">
            <button type="button" onClick={() => startRound(difficulty)}>
              New sky
            </button>
            <button type="button" onClick={restartRound}>
              Restart
            </button>
            <button type="button" onClick={undo} disabled={!history.length}>
              Undo
            </button>
            <button type="button" onClick={showHint} disabled={status !== 'playing'}>
              Hint
            </button>
          </div>
        </section>

        <section className="luma-stage" aria-label="Luma constellation">
          <div className="luma-stage__halo" />
          <div
            className="luma-board"
            ref={boardRef}
            style={{ '--luma-size': definition.size } as CSSProperties}
            role="grid"
            aria-label={`${definition.label} ${definition.size} by ${definition.size} board`}
          >
            {board.map((lit, index) => {
              const row = Math.floor(index / definition.size);
              const column = index % definition.size;
              return (
                <button
                  type="button"
                  role="gridcell"
                  key={index}
                  data-luma-cell
                  data-lit={lit}
                  className={`${lit ? 'is-lit' : 'is-quiet'} ${
                    hintIndex === index ? 'is-hint' : ''
                  }`}
                  aria-label={`Row ${row + 1}, column ${column + 1}, ${lit ? 'lit' : 'quiet'}`}
                  aria-pressed={lit}
                  onClick={() => pressCell(index)}
                  onKeyDown={(event) => moveFocus(event, index)}
                >
                  <span />
                </button>
              );
            })}
          </div>

          {status === 'paused' ? (
            <div className="luma-overlay" role="status">
              <span>TIME HELD</span>
              <strong>Sky paused</strong>
              <button type="button" onClick={() => setStatus('playing')}>
                Resume
              </button>
            </div>
          ) : null}

          {status === 'won' ? (
            <div className="luma-overlay is-win" role="status">
              <span>{assisted ? 'PRACTICE COMPLETE' : 'CONSTELLATION COMPLETE'}</span>
              <strong>Quiet sky restored</strong>
              <p>
                {moves} moves · {formatLumaTime(seconds)}
              </p>
              <button type="button" onClick={() => startRound(difficulty)}>
                Next constellation
              </button>
            </div>
          ) : null}
        </section>
      </main>

      <footer className="luma-footer">
        <span>Arrow keys move</span>
        <span>Enter pulses</span>
        <strong>Scores stay on this device</strong>
      </footer>
    </div>
  );
}

function readBestRecords(): BestRecords {
  try {
    const stored = JSON.parse(localStorage.getItem(BEST_RECORDS_KEY) ?? '{}');
    if (!stored || typeof stored !== 'object') return {};
    const records: BestRecords = {};
    for (const difficulty of LUMA_DIFFICULTIES) {
      const candidate = (stored as Record<string, unknown>)[difficulty.id];
      if (!candidate || typeof candidate !== 'object') continue;
      const { moves, seconds } = candidate as Partial<BestRecord>;
      if (
        typeof moves === 'number' &&
        Number.isFinite(moves) &&
        moves > 0 &&
        typeof seconds === 'number' &&
        Number.isFinite(seconds) &&
        seconds >= 0
      ) {
        records[difficulty.id] = { moves: Math.floor(moves), seconds: Math.floor(seconds) };
      }
    }
    return records;
  } catch {
    return {};
  }
}

function persistBestRecords(records: BestRecords) {
  try {
    localStorage.setItem(BEST_RECORDS_KEY, JSON.stringify(records));
  } catch {
    // Best scores are optional; play remains available when storage is blocked.
  }
}

function isBetterRecord(candidate: BestRecord, current?: BestRecord) {
  if (!current) return true;
  return (
    candidate.moves < current.moves ||
    (candidate.moves === current.moves && candidate.seconds < current.seconds)
  );
}

function createSeed() {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now();
  }
  return Date.now();
}

function shortSeed(seed: number) {
  return seed.toString(36).toLocaleUpperCase().slice(-5).padStart(5, '0');
}
