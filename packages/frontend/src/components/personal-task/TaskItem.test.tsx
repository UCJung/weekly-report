import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// @dnd-kit/sortable mock — 테스트 환경에서 드래그 기능 비활성화
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}));

import TaskItem from './TaskItem';
import { PersonalTask } from '../../api/personal-task.api';

// 기본 테스트용 task 팩토리
function makeTask(overrides: Partial<PersonalTask> = {}): PersonalTask {
  return {
    id: 'task-1',
    memberId: 'member-1',
    teamId: 'team-1',
    title: '테스트 작업 제목',
    priority: 'MEDIUM',
    status: 'TODO',
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('TaskItem', () => {
  const onSelect = vi.fn();
  const onToggleDone = vi.fn();

  beforeEach(() => {
    onSelect.mockClear();
    onToggleDone.mockClear();
  });

  // ──────────────────────────────────────────────
  // 1. 작업 제목 렌더링
  // ──────────────────────────────────────────────

  test('renders task title', () => {
    const task = makeTask({ title: '내 작업 항목' });
    render(
      <TaskItem
        task={task}
        isSelected={false}
        onSelect={onSelect}
        onToggleDone={onToggleDone}
      />,
    );
    expect(screen.getByText('내 작업 항목')).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // 2. projectId 있을 때 프로젝트 배지 표시
  // ──────────────────────────────────────────────

  test('shows project badge when project exists', () => {
    const task = makeTask({
      projectId: 'proj-1',
      project: { id: 'proj-1', name: '스마트팩토리', code: 'SF' },
    });
    render(
      <TaskItem
        task={task}
        isSelected={false}
        onSelect={onSelect}
        onToggleDone={onToggleDone}
      />,
    );
    expect(screen.getByText('스마트팩토리')).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // 3. project 없을 때 배지 미표시
  // ──────────────────────────────────────────────

  test('does not show project badge when no project', () => {
    const task = makeTask({ project: undefined, projectId: undefined });
    render(
      <TaskItem
        task={task}
        isSelected={false}
        onSelect={onSelect}
        onToggleDone={onToggleDone}
      />,
    );
    // 프로젝트명이 없으므로 배지가 없어야 함
    expect(screen.queryByText('스마트팩토리')).toBeNull();
  });

  // ──────────────────────────────────────────────
  // 4. 마감 초과 + 미완료 → danger 색상 적용
  // ──────────────────────────────────────────────

  test('shows overdue styling when dueDate is past and status is not DONE', () => {
    // 어제 날짜 설정 (기한 초과)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const task = makeTask({
      status: 'TODO',
      dueDate: yesterday.toISOString(),
    });
    const { container } = render(
      <TaskItem
        task={task}
        isSelected={false}
        onSelect={onSelect}
        onToggleDone={onToggleDone}
      />,
    );

    // 마감일 표시 span이 danger 색상을 사용해야 함
    const dueDateSpan = container.querySelector('span[style*="var(--danger)"]');
    expect(dueDateSpan).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // 5. DONE 상태일 때 취소선 + 체크박스 checked
  // ──────────────────────────────────────────────

  test('renders strikethrough title and checked checkbox when DONE', () => {
    const task = makeTask({ status: 'DONE' });
    const { container } = render(
      <TaskItem
        task={task}
        isSelected={false}
        onSelect={onSelect}
        onToggleDone={onToggleDone}
      />,
    );

    // 취소선 클래스 확인
    const titleSpan = container.querySelector('span.line-through');
    expect(titleSpan).toBeTruthy();

    // 체크 아이콘(svg) 렌더링 확인
    const svg = container.querySelector('svg path[d="M1 4L3.5 6.5L9 1"]');
    expect(svg).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // 6. TODO 상태일 때 취소선 없음 + 체크박스 unchecked
  // ──────────────────────────────────────────────

  test('renders normal title and unchecked checkbox when TODO', () => {
    const task = makeTask({ status: 'TODO' });
    const { container } = render(
      <TaskItem
        task={task}
        isSelected={false}
        onSelect={onSelect}
        onToggleDone={onToggleDone}
      />,
    );

    // 취소선 없음
    expect(container.querySelector('span.line-through')).toBeNull();

    // 체크 아이콘 없음
    const svg = container.querySelector('svg path[d="M1 4L3.5 6.5L9 1"]');
    expect(svg).toBeNull();
  });

  // ──────────────────────────────────────────────
  // 7. 체크박스 클릭 시 onToggleDone 호출
  // ──────────────────────────────────────────────

  test('calls onToggleDone when checkbox button is clicked', () => {
    const task = makeTask();
    render(
      <TaskItem
        task={task}
        isSelected={false}
        onSelect={onSelect}
        onToggleDone={onToggleDone}
      />,
    );

    const checkbox = screen.getByRole('button', { name: '완료 처리' });
    fireEvent.click(checkbox);
    expect(onToggleDone).toHaveBeenCalledWith(task.id);
  });

  // ──────────────────────────────────────────────
  // 8. 행 클릭 시 onSelect 콜백 호출
  // ──────────────────────────────────────────────

  test('calls onSelect when row is clicked', () => {
    const task = makeTask();
    render(
      <TaskItem
        task={task}
        isSelected={false}
        onSelect={onSelect}
        onToggleDone={onToggleDone}
      />,
    );

    const row = screen.getByRole('button', { name: /테스트 작업/ });
    // tabIndex=0 div는 role=button으로 인식되지 않을 수 있으므로 제목으로 클릭
    const titleSpan = screen.getByText('테스트 작업 제목');
    fireEvent.click(titleSpan);
    expect(onSelect).toHaveBeenCalledWith(task);
  });

  // ──────────────────────────────────────────────
  // 9. DONE 상태이면 dueDate가 있어도 overdue 스타일 미적용
  // ──────────────────────────────────────────────

  test('does not show overdue style when DONE even if dueDate is past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const task = makeTask({
      status: 'DONE',
      dueDate: yesterday.toISOString(),
    });
    const { container } = render(
      <TaskItem
        task={task}
        isSelected={false}
        onSelect={onSelect}
        onToggleDone={onToggleDone}
      />,
    );

    // danger 색상이 없어야 함
    const dueDateSpan = container.querySelector('span[style*="var(--danger)"]');
    expect(dueDateSpan).toBeNull();
  });
});
