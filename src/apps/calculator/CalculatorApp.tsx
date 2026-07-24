import { useState } from 'react';
import './calculator.css';

type Operator = 'add' | 'subtract' | 'multiply' | 'divide';

const KEYS = [
  { label: 'AC', action: 'clear', tone: 'utility' },
  { label: '±', action: 'sign', tone: 'utility' },
  { label: '%', action: 'percent', tone: 'utility' },
  { label: '÷', action: 'divide', tone: 'operator' },
  { label: '7', action: '7' },
  { label: '8', action: '8' },
  { label: '9', action: '9' },
  { label: '×', action: 'multiply', tone: 'operator' },
  { label: '4', action: '4' },
  { label: '5', action: '5' },
  { label: '6', action: '6' },
  { label: '−', action: 'subtract', tone: 'operator' },
  { label: '1', action: '1' },
  { label: '2', action: '2' },
  { label: '3', action: '3' },
  { label: '+', action: 'add', tone: 'operator' },
  { label: '0', action: '0', wide: true },
  { label: '.', action: 'decimal' },
  { label: '=', action: 'equals', tone: 'equals' },
] as const;

export function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const runAction = (action: string) => {
    if (/^\d$/.test(action)) {
      setDisplay((current) => {
        if (waitingForOperand || current === '0' || current === 'Error') return action;
        return current.replace('-', '').length >= 10 ? current : current + action;
      });
      setWaitingForOperand(false);
      return;
    }

    if (action === 'decimal') {
      if (waitingForOperand || display === 'Error') {
        setDisplay('0.');
        setWaitingForOperand(false);
      } else if (!display.includes('.')) {
        setDisplay(`${display}.`);
      }
      return;
    }

    if (action === 'clear') {
      setDisplay('0');
      setStoredValue(null);
      setOperator(null);
      setWaitingForOperand(false);
      return;
    }

    if (action === 'sign') {
      if (display !== '0' && display !== 'Error') {
        setDisplay(display.startsWith('-') ? display.slice(1) : `-${display}`);
      }
      return;
    }

    if (action === 'percent') {
      setDisplay(formatResult(Number(display) / 100));
      return;
    }

    if (action === 'equals') {
      if (operator && storedValue !== null && display !== 'Error') {
        setDisplay(formatResult(calculate(storedValue, Number(display), operator)));
        setStoredValue(null);
        setOperator(null);
        setWaitingForOperand(true);
      }
      return;
    }

    if (isOperator(action)) {
      const currentValue = Number(display);
      if (operator && storedValue !== null && !waitingForOperand) {
        const result = calculate(storedValue, currentValue, operator);
        setDisplay(formatResult(result));
        setStoredValue(result);
      } else {
        setStoredValue(currentValue);
      }
      setOperator(action);
      setWaitingForOperand(true);
    }
  };

  return (
    <div className="calculator-app">
      <div className="calculator-display" aria-live="polite" aria-atomic="true">
        <span>{display}</span>
      </div>
      <div className="calculator-keypad" aria-label="Calculator keypad">
        {KEYS.map((key) => (
          <button
            key={`${key.action}-${key.label}`}
            type="button"
            className={`calculator-key calculator-key--${'tone' in key ? key.tone : 'number'} ${
              'wide' in key && key.wide ? 'calculator-key--wide' : ''
            } ${operator === key.action && waitingForOperand ? 'is-active' : ''}`}
            aria-label={calculatorAriaLabel(key.action)}
            onClick={() => runAction(key.action)}
          >
            {key.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function calculate(left: number, right: number, operator: Operator): number {
  switch (operator) {
    case 'add':
      return left + right;
    case 'subtract':
      return left - right;
    case 'multiply':
      return left * right;
    case 'divide':
      return right === 0 ? Number.NaN : left / right;
  }
}

function formatResult(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  return String(Number(value.toPrecision(10)));
}

function isOperator(value: string): value is Operator {
  return ['add', 'subtract', 'multiply', 'divide'].includes(value);
}

function calculatorAriaLabel(action: string): string {
  const labels: Record<string, string> = {
    clear: 'Clear',
    sign: 'Toggle positive or negative',
    percent: 'Percent',
    divide: 'Divide',
    multiply: 'Multiply',
    subtract: 'Subtract',
    add: 'Add',
    decimal: 'Decimal point',
    equals: 'Equals',
  };
  return labels[action] ?? action;
}
