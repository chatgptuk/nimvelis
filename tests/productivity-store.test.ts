import { beforeEach, describe, expect, it } from 'vitest';
import { useProductivityStore } from '../src/state/productivity-store';

describe('productivity store', () => {
  beforeEach(() => {
    localStorage.clear();
    useProductivityStore.setState({ tasks: [], events: [] });
  });

  it('creates, completes, and clears local tasks', () => {
    const id = useProductivityStore.getState().addTask({
      title: '  Prepare Aurora notes  ',
      dueDate: '2026-07-23',
      priority: 'high',
    });

    expect(id).toBeTruthy();
    expect(useProductivityStore.getState().tasks[0]).toMatchObject({
      title: 'Prepare Aurora notes',
      dueDate: '2026-07-23',
      priority: 'high',
      completed: false,
    });

    if (!id) throw new Error('Expected a task ID');
    useProductivityStore.getState().toggleTask(id);
    expect(useProductivityStore.getState().tasks[0]?.completed).toBe(true);

    useProductivityStore.getState().clearCompletedTasks();
    expect(useProductivityStore.getState().tasks).toEqual([]);
  });

  it('validates and orders local calendar data without accepting invalid dates', () => {
    const rejected = useProductivityStore.getState().addEvent({
      title: 'Invalid',
      date: 'tomorrow',
    });
    const accepted = useProductivityStore.getState().addEvent({
      title: 'Design review',
      date: '2026-07-24',
      time: '09:30',
      color: 'violet',
    });

    expect(rejected).toBeNull();
    expect(accepted).toBeTruthy();
    expect(useProductivityStore.getState().events).toHaveLength(1);
    expect(useProductivityStore.getState().events[0]).toMatchObject({
      title: 'Design review',
      date: '2026-07-24',
      time: '09:30',
      color: 'violet',
    });
  });
});
