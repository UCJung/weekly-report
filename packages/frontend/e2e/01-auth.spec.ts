import { test, expect } from '@playwright/test';

/**
 * E2E 테스트 시나리오 #1: 인증 및 역할 기반 접근 제어
 *
 * 사전 조건:
 * - 백엔드 서버 실행 중 (localhost:3000)
 * - 프론트엔드 서버 실행 중 (localhost:5173)
 * - DB 시드 데이터 적용 완료 (bunx prisma db seed)
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

test.describe('인증 시나리오', () => {
  test('로그인 페이지 렌더링', async ({ page }) => {
    await page.goto(BASE_URL + '/login');
    await expect(page.getByText('UC TeamSpace')).toBeVisible({ timeout: 5000 });
  });

  test('유효하지 않은 자격증명으로 로그인 실패', async ({ page }) => {
    await page.goto(BASE_URL + '/login');
    await page.getByLabel(/이메일|Email/i).fill('invalid@example.com');
    await page.getByLabel(/비밀번호|Password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /로그인/i }).click();
    // 오류 메시지 또는 로그인 페이지 유지 확인
    await expect(page).toHaveURL(BASE_URL + '/login');
  });
});

test.describe('역할 기반 접근 제어 (시나리오 #5)', () => {
  test('미인증 상태에서 보호된 페이지 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    await page.goto(BASE_URL + '/my-report');
    await expect(page).toHaveURL(BASE_URL + '/login');
  });

  test('미인증 상태에서 팀 관리 페이지 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    await page.goto(BASE_URL + '/team-mgmt');
    await expect(page).toHaveURL(BASE_URL + '/login');
  });
});
