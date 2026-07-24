import { useMemo, useState, type FormEvent } from 'react';
import { Icon } from '../../design/Icon';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import {
  useProductivityStore,
  type CalendarEventColor,
  type LocalCalendarEvent,
} from '../../state/productivity-store';
import './calendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS: CalendarEventColor[] = ['blue', 'teal', 'violet', 'rose', 'amber'];

export function CalendarApp({ system }: SystemAppProps) {
  const events = useProductivityStore((state) => state.events);
  const tasks = useProductivityStore((state) => state.tasks);
  const addEvent = useProductivityStore((state) => state.addEvent);
  const removeEvent = useProductivityStore((state) => state.removeEvent);
  const today = dateKey(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(today);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [color, setColor] = useState<CalendarEventColor>('blue');

  const days = useMemo(() => monthGrid(visibleMonth), [visibleMonth]);
  const selectedEvents = events.filter((event) => event.date === selectedDate).sort(compareEvents);
  const selectedTasks = tasks.filter((task) => !task.completed && task.dueDate === selectedDate);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!addEvent({ title, date: selectedDate, time: time || undefined, color })) return;
    setTitle('');
    setTime('');
    system.notify('Calendar event added', 'success');
  };

  const goToToday = () => {
    const now = new Date();
    setVisibleMonth(startOfMonth(now));
    setSelectedDate(dateKey(now));
  };

  return (
    <div className="calendar-app">
      <header className="calendar-toolbar">
        <div>
          <span className="calendar-mark">
            <Icon name="calendar" size={20} />
          </span>
          <span>
            <strong>
              {new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
                visibleMonth,
              )}
            </strong>
            <small>Local calendar</small>
          </span>
        </div>
        <div className="calendar-toolbar__actions">
          <button type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}>
            ‹
          </button>
          <button type="button" className="calendar-today" onClick={goToToday}>
            Today
          </button>
          <button type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}>
            ›
          </button>
        </div>
      </header>

      <main className="calendar-layout">
        <section className="calendar-month" aria-label="Month">
          <div className="calendar-weekdays" aria-hidden="true">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {days.map((day) => {
              const key = dateKey(day);
              const dayEvents = events.filter((item) => item.date === key);
              const taskCount = tasks.filter(
                (task) => !task.completed && task.dueDate === key,
              ).length;
              return (
                <button
                  type="button"
                  key={key}
                  className={[
                    'calendar-day',
                    day.getMonth() !== visibleMonth.getMonth() ? 'is-outside' : '',
                    key === today ? 'is-today' : '',
                    key === selectedDate ? 'is-selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={formatLongDate(key)}
                  aria-pressed={key === selectedDate}
                  onClick={() => {
                    setSelectedDate(key);
                    if (day.getMonth() !== visibleMonth.getMonth()) {
                      setVisibleMonth(startOfMonth(day));
                    }
                  }}
                >
                  <span>{day.getDate()}</span>
                  <span className="calendar-day__dots">
                    {dayEvents.slice(0, 3).map((item) => (
                      <i className={`is-${item.color}`} key={item.id} />
                    ))}
                    {taskCount ? <i className="is-task" title={`${taskCount} tasks`} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="calendar-agenda">
          <header>
            <span>{selectedDate === today ? 'TODAY' : 'AGENDA'}</span>
            <h2>{formatAgendaDate(selectedDate)}</h2>
            <p>
              {selectedEvents.length + selectedTasks.length
                ? `${selectedEvents.length + selectedTasks.length} item${
                    selectedEvents.length + selectedTasks.length === 1 ? '' : 's'
                  }`
                : 'A clear day'}
            </p>
          </header>

          <form className="calendar-composer" onSubmit={submit}>
            <input
              value={title}
              maxLength={160}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="New event"
              aria-label="Event title"
            />
            <div>
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                aria-label="Event time"
              />
              <span className="calendar-color-picker" aria-label="Event color">
                {COLORS.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`is-${item} ${color === item ? 'is-selected' : ''}`}
                    aria-label={`${item} event color`}
                    aria-pressed={color === item}
                    onClick={() => setColor(item)}
                  />
                ))}
              </span>
              <button type="submit" disabled={!title.trim()} aria-label="Add event">
                <Icon name="plus" size={16} />
              </button>
            </div>
          </form>

          <div className="calendar-agenda__list">
            {selectedEvents.map((event) => (
              <AgendaEvent key={event.id} event={event} onRemove={() => removeEvent(event.id)} />
            ))}
            {selectedTasks.map((task) => (
              <article className="calendar-agenda-item is-task" key={task.id}>
                <i />
                <div>
                  <strong>{task.title}</strong>
                  <small>Task · {task.priority} priority</small>
                </div>
                <Icon name="tasks" size={15} />
              </article>
            ))}
            {!selectedEvents.length && !selectedTasks.length ? (
              <div className="calendar-empty">
                <Icon name="calendar" size={25} />
                <strong>Nothing planned</strong>
                <span>Add an event or leave room for whatever arrives.</span>
              </div>
            ) : null}
          </div>
        </aside>
      </main>
    </div>
  );
}

function AgendaEvent({ event, onRemove }: { event: LocalCalendarEvent; onRemove: () => void }) {
  return (
    <article className="calendar-agenda-item">
      <i className={`is-${event.color}`} />
      <div>
        <strong>{event.title}</strong>
        <small>{event.time ? formatTime(event.time) : 'All day'}</small>
      </div>
      <button type="button" aria-label={`Delete ${event.title}`} onClick={onRemove}>
        <Icon name="trash" size={14} />
      </button>
    </article>
  );
}

function monthGrid(month: Date) {
  const first = startOfMonth(month);
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  return Array.from(
    { length: 42 },
    (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function compareEvents(left: LocalCalendarEvent, right: LocalCalendarEvent) {
  if (left.time && right.time) return left.time.localeCompare(right.time);
  if (left.time) return -1;
  if (right.time) return 1;
  return left.createdAt - right.createdAt;
}

function formatAgendaDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(parseDateKey(value));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parseDateKey(value));
}

function formatTime(value: string) {
  const [hour = 0, minute = 0] = value.split(':').map(Number);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(2020, 0, 1, hour, minute));
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function parseDateKey(value: string) {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
