import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// 로그인 페이지가 기본 리다이렉트 대상이므로 Login 컴포넌트만 테스트
import Login from './pages/Login';
import { MemoryRouter } from 'react-router-dom';

describe('Login Page', () => {
  test('renders login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(screen.getAllByText('UC TeamSpace').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('email@example.com')).toBeDefined();
  });
});
