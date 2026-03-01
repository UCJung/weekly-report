import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormattedText from './FormattedText';

describe('FormattedText', () => {
  test('renders plain text', () => {
    render(<FormattedText text="일반 텍스트" />);
    expect(screen.getByText('일반 텍스트')).toBeDefined();
  });

  test('renders [항목] as bold primary', () => {
    const { container } = render(<FormattedText text="[업무항목]" />);
    const el = container.querySelector('.font-semibold');
    expect(el).toBeTruthy();
    expect(el?.textContent).toContain('[업무항목]');
  });

  test('renders *세부 as bullet', () => {
    render(<FormattedText text="*세부업무" />);
    expect(screen.getByText(/•\s*세부업무/)).toBeDefined();
  });

  test('renders ㄴ상세 with indentation', () => {
    const { container } = render(<FormattedText text="ㄴ상세작업" />);
    const el = container.querySelector('.pl-\\[18px\\]');
    expect(el).toBeTruthy();
  });

  test('renders multiline', () => {
    render(<FormattedText text={'[항목]\n*세부\nㄴ상세'} />);
    expect(screen.getByText(/세부/)).toBeDefined();
    expect(screen.getByText(/상세/)).toBeDefined();
  });

  test('returns null for empty text', () => {
    const { container } = render(<FormattedText text="" />);
    expect(container.firstChild).toBeNull();
  });
});
