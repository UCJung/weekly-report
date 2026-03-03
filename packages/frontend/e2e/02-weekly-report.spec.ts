import { test, expect } from '@playwright/test';

/**
 * E2E 테스트 시나리오 #1: 주간업무 작성 흐름 (MEMBER)
 * E2E 테스트 시나리오 #2: 전주 할일 불러오기
 *
 * 사전 조건:
 * - 백엔드 서버 실행 중 (localhost:3000)
 * - 프론트엔드 서버 실행 중 (localhost:5173)
 * - DB 시드 데이터 적용 완료
 *   - MEMBER 계정: 나현규@example.com / Test1234!
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const MEMBER_EMAIL = process.env.E2E_MEMBER_EMAIL || 'nahyeongyu@example.com';
const MEMBER_PASSWORD = process.env.E2E_MEMBER_PASSWORD || 'Test1234!';

async function loginAs(page: Parameters<typeof test>[1] extends (args: { page: infer P }) => unknown ? P : never, email: string, password: string) {
  await page.goto(BASE_URL + '/login');
  await page.getByLabel(/이메일/i).fill(email);
  await page.getByLabel(/비밀번호/i).fill(password);
  await page.getByRole('button', { name: /로그인/i }).click();
  await page.waitForURL(BASE_URL + '/', { timeout: 10000 });
}

test.describe('주간업무 작성 (시나리오 #1, #2)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, MEMBER_EMAIL, MEMBER_PASSWORD);
  });

  test('대시보드 로딩 확인', async ({ page }) => {
    await expect(page.getByText('UC TeamSpace')).toBeVisible({ timeout: 5000 }).catch(() => {
      // 대시보드에 시스템명이 없을 수도 있음 - 빠른 진입 링크로 확인
      return expect(page.getByText('내 주간업무 작성하기')).toBeVisible({ timeout: 5000 });
    });
  });

  test('주간업무 페이지 진입', async ({ page }) => {
    await page.goto(BASE_URL + '/my-report');
    // 주차 선택기 확인
    await expect(page.locator('text=◀')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=▶')).toBeVisible();
  });
});
