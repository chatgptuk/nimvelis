import { useMemo, useState, type FormEvent } from 'react';
import { Icon } from '../../design/Icon';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import {
  useProductivityStore,
  type LocalTask,
  type TaskPriority,
} from '../../state/productivity-store';
import './tasks.css';

type TaskView = 'today' | 'scheduled' | 'all' | 'completed';

const VIEWS: Array<{ id: TaskView; label: string; icon: 'sun' | 'calendar' | 'tasks' | 'check' }> =
  [
    { id: 'today', label: 'Today', icon: 'sun' },
    { id: 'scheduled', label: 'Scheduled', icon: 'calendar' },
    { id: 'all', label: 'All tasks', icon: 'tasks' },
    { id: 'completed', label: 'Completed', icon: 'check' },
  ];

export function TasksApp({ system }: SystemAppProps) {
  const tasks = useProductivityStore((state) => state.tasks);
  const addTask = useProductivityStore((state) => state.addTask);
  const toggleTask = useProductivityStore((state) => state.toggleTask);
  const removeTask = useProductivityStore((state) => state.removeTask);
  const clearCompletedTasks = useProductivityStore((state) => state.clearCompletedTasks);
  const [view, setView] = useState<TaskView>('today');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const today = dateKey(new Date());

  const visibleTasks = useMemo(
    () =>
      tasks
        .filter((task) => matchesView(task, view, today))
        .sort((left, right) => compareTasks(left, right)),
    [tasks, today, view],
  );
  const openCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.length - openCount;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const id = addTask({ title, dueDate: dueDate || undefined, priority });
    if (!id) return;
    setTitle('');
    setDueDate('');
    setPriority('normal');
    system.notify('Task added', 'success');
  };

  return (
    <div className="tasks-app">
      <aside className="tasks-sidebar">
        <header>
          <span className="tasks-sidebar__mark">
            <Icon name="tasks" size={19} />
          </span>
          <span>
            <strong>Tasks</strong>
            <small>On this device</small>
          </span>
        </header>
        <nav aria-label="Task lists">
          {VIEWS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={view === item.id ? 'is-active' : ''}
              onClick={() => setView(item.id)}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
              <span>{countForView(tasks, item.id, today)}</span>
            </button>
          ))}
        </nav>
        <div className="tasks-progress">
          <div>
            <strong>{openCount}</strong>
            <span>open</span>
          </div>
          <div>
            <strong>{completedCount}</strong>
            <span>done</span>
          </div>
          <span>
            <i
              style={{
                width: `${tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%`,
              }}
            />
          </span>
        </div>
      </aside>

      <main className="tasks-main">
        <header className="tasks-heading">
          <div>
            <span>LOCAL PRODUCTIVITY</span>
            <h2>{VIEWS.find((item) => item.id === view)?.label}</h2>
            <p>{describeView(view, today)}</p>
          </div>
          {completedCount > 0 && view === 'completed' ? (
            <button
              type="button"
              className="tasks-clear"
              onClick={() => {
                if (!globalThis.confirm('Remove all completed tasks?')) return;
                clearCompletedTasks();
              }}
            >
              Clear completed
            </button>
          ) : null}
        </header>

        <form className="tasks-composer" onSubmit={submit}>
          <span className={`tasks-priority-dot is-${priority}`} />
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, 160))}
            placeholder="Add a task"
            aria-label="Task title"
          />
          <label>
            <span>Due date</span>
            <input
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              aria-label="Task due date"
            />
          </label>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            aria-label="Task priority"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
          <button type="submit" disabled={!title.trim()} aria-label="Add task">
            <Icon name="plus" size={17} />
          </button>
        </form>

        <section className="tasks-list" aria-label={`${view} tasks`}>
          {visibleTasks.length ? (
            visibleTasks.map((task) => (
              <article className={`task-row ${task.completed ? 'is-completed' : ''}`} key={task.id}>
                <button
                  type="button"
                  className="task-row__check"
                  aria-label={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.completed ? <Icon name="check" size={14} /> : null}
                </button>
                <span className={`tasks-priority-dot is-${task.priority}`} />
                <div>
                  <strong>{task.title}</strong>
                  <small className={isOverdue(task, today) ? 'is-overdue' : ''}>
                    {task.dueDate
                      ? formatDueDate(task.dueDate, today)
                      : task.completed
                        ? 'Completed locally'
                        : 'No due date'}
                  </small>
                </div>
                <button
                  type="button"
                  className="task-row__delete"
                  aria-label={`Delete ${task.title}`}
                  onClick={() => removeTask(task.id)}
                >
                  <Icon name="trash" size={15} />
                </button>
              </article>
            ))
          ) : (
            <div className="tasks-empty">
              <span>
                <Icon name={view === 'completed' ? 'check' : 'tasks'} size={28} />
              </span>
              <strong>
                {view === 'completed' ? 'Nothing completed yet' : 'This list is clear'}
              </strong>
              <p>
                {view === 'today'
                  ? 'Add a task above or enjoy the open space.'
                  : 'Tasks matching this view will appear here.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function matchesView(task: LocalTask, view: TaskView, today: string) {
  if (view === 'completed') return task.completed;
  if (task.completed) return false;
  if (view === 'today') return task.dueDate === today || !task.dueDate;
  if (view === 'scheduled') return Boolean(task.dueDate);
  return true;
}

function countForView(tasks: LocalTask[], view: TaskView, today: string) {
  return tasks.filter((task) => matchesView(task, view, today)).length;
}

function compareTasks(left: LocalTask, right: LocalTask) {
  const weight: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 };
  if (weight[left.priority] !== weight[right.priority]) {
    return weight[left.priority] - weight[right.priority];
  }
  if (left.dueDate && right.dueDate) return left.dueDate.localeCompare(right.dueDate);
  if (left.dueDate) return -1;
  if (right.dueDate) return 1;
  return right.createdAt - left.createdAt;
}

function describeView(view: TaskView, today: string) {
  if (view === 'today') {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(parseDateKey(today));
  }
  if (view === 'scheduled') return 'Every task with a date';
  if (view === 'completed') return 'Finished and ready to archive';
  return 'Everything still in motion';
}

function formatDueDate(value: string, today: string) {
  if (value === today) return 'Due today';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (value === dateKey(tomorrow)) return 'Due tomorrow';
  return `Due ${new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(parseDateKey(value))}`;
}

function isOverdue(task: LocalTask, today: string) {
  return Boolean(!task.completed && task.dueDate && task.dueDate < today);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}
