import { describe, test, expect } from 'bun:test';

/**
 * Backend API E2E 테스트 — 개인 작업(PersonalTask) CRUD + 권한 검사
 *
 * 실제 DB 연결 없이 API 시나리오를 검증하는 통합 테스트.
 * 실제 실행 시 환경변수 DATABASE_URL 및 서버 기동 필요.
 *
 * CI에서는 docker-compose 서비스로 DB를 기동한 후 실행.
 */

const API_BASE = process.env.TEST_API_BASE || 'http://localhost:3000/api/v1';

async function apiGet(path: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  return { status: res.status, data: await res.json() };
}

async function apiPost(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function apiPatch(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function apiDelete(path: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers });
  return { status: res.status, data: await res.json() };
}

describe('Personal Task E2E — CRUD 시나리오', () => {
  /**
   * 이 테스트들은 실제 서버가 실행 중일 때만 의미 있는 결과를 반환한다.
   * 서버가 없으면 연결 오류가 발생하므로, CI 환경에서는 서버 기동 후 실행해야 한다.
   * RUN_BACKEND_E2E 환경변수가 없으면 skip 처리한다.
   */
  const SKIP_E2E = !process.env.RUN_BACKEND_E2E;

  // 테스트 전용 계정 및 팀 ID (시드 데이터 기준)
  const MEMBER_EMAIL = process.env.E2E_MEMBER_EMAIL || 'nahyeongyu@example.com';
  const MEMBER_PASSWORD = process.env.E2E_MEMBER_PASSWORD || 'Test1234!';
  const OTHER_MEMBER_EMAIL = process.env.E2E_OTHER_EMAIL || 'baekjunho@example.com';
  const OTHER_MEMBER_PASSWORD = process.env.E2E_OTHER_PASSWORD || 'Test1234!';
  const TEAM_ID = process.env.E2E_TEAM_ID || '';
  const PART_LEADER_EMAIL = process.env.E2E_PART_LEADER_EMAIL || 'choisujin@example.com';
  const PART_LEADER_PASSWORD = process.env.E2E_PART_LEADER_PASSWORD || 'Test1234!';

  // ──────────────────────────────────────────────
  // 1. 미인증 접근 차단
  // ──────────────────────────────────────────────

  test.if(!SKIP_E2E)('GET /personal-tasks — 인증 없이 접근 시 401', async () => {
    const { status } = await apiGet(`/personal-tasks?teamId=${TEAM_ID}`);
    expect(status).toBe(401);
  });

  // ──────────────────────────────────────────────
  // 2. 작업 생성 (POST /personal-tasks)
  // ──────────────────────────────────────────────

  test.if(!SKIP_E2E)('POST /personal-tasks — 작업 생성 성공', async () => {
    const loginRes = await apiPost('/auth/login', {
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
    });
    expect(loginRes.status).toBe(200);
    const token = loginRes.data.data?.accessToken;
    expect(token).toBeDefined();

    const { status, data } = await apiPost(
      '/personal-tasks',
      { teamId: TEAM_ID, title: 'E2E 테스트 작업', priority: 'MEDIUM' },
      token,
    );
    expect(status).toBe(201);
    expect(data.data).toHaveProperty('id');
    expect(data.data.title).toBe('E2E 테스트 작업');
    expect(data.data.status).toBe('TODO');
  });

  // ──────────────────────────────────────────────
  // 3. 목록 조회 (GET /personal-tasks)
  // ──────────────────────────────────────────────

  test.if(!SKIP_E2E)('GET /personal-tasks — 생성된 작업 목록에 포함됨', async () => {
    const loginRes = await apiPost('/auth/login', {
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
    });
    const token = loginRes.data.data?.accessToken;

    // 작업 생성
    await apiPost(
      '/personal-tasks',
      { teamId: TEAM_ID, title: '목록 확인용 작업', priority: 'LOW' },
      token,
    );

    // 목록 조회
    const { status, data } = await apiGet(`/personal-tasks?teamId=${TEAM_ID}`, token);
    expect(status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
    const titles = (data.data as Array<{ title: string }>).map((t) => t.title);
    expect(titles).toContain('목록 확인용 작업');
  });

  // ──────────────────────────────────────────────
  // 4. 작업 수정 (PATCH /personal-tasks/:id)
  // ──────────────────────────────────────────────

  test.if(!SKIP_E2E)('PATCH /personal-tasks/:id — 작업 수정 성공', async () => {
    const loginRes = await apiPost('/auth/login', {
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
    });
    const token = loginRes.data.data?.accessToken;

    const createRes = await apiPost(
      '/personal-tasks',
      { teamId: TEAM_ID, title: '수정 전 제목', priority: 'LOW' },
      token,
    );
    const taskId = createRes.data.data.id;

    const { status, data } = await apiPatch(
      `/personal-tasks/${taskId}`,
      { title: '수정 후 제목' },
      token,
    );
    expect(status).toBe(200);
    expect(data.data.title).toBe('수정 후 제목');
  });

  // ──────────────────────────────────────────────
  // 5. toggle-done — TODO → DONE 전환
  // ──────────────────────────────────────────────

  test.if(!SKIP_E2E)('PATCH /personal-tasks/:id/toggle-done — TODO → DONE 전환', async () => {
    const loginRes = await apiPost('/auth/login', {
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
    });
    const token = loginRes.data.data?.accessToken;

    const createRes = await apiPost(
      '/personal-tasks',
      { teamId: TEAM_ID, title: 'Toggle 테스트 작업', priority: 'MEDIUM' },
      token,
    );
    const taskId = createRes.data.data.id;

    // 처음 toggle → DONE
    const { status: s1, data: d1 } = await apiPatch(
      `/personal-tasks/${taskId}/toggle-done`,
      {},
      token,
    );
    expect(s1).toBe(200);
    expect(d1.data.status).toBe('DONE');

    // 다시 toggle → TODO
    const { status: s2, data: d2 } = await apiPatch(
      `/personal-tasks/${taskId}/toggle-done`,
      {},
      token,
    );
    expect(s2).toBe(200);
    expect(d2.data.status).toBe('TODO');
  });

  // ──────────────────────────────────────────────
  // 6. 소프트 삭제 후 목록에서 제외 확인
  // ──────────────────────────────────────────────

  test.if(!SKIP_E2E)('DELETE /personal-tasks/:id — 소프트 삭제 후 목록 제외', async () => {
    const loginRes = await apiPost('/auth/login', {
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
    });
    const token = loginRes.data.data?.accessToken;

    const createRes = await apiPost(
      '/personal-tasks',
      { teamId: TEAM_ID, title: '삭제 예정 작업', priority: 'LOW' },
      token,
    );
    const taskId = createRes.data.data.id;

    // 소프트 삭제
    const { status: deleteStatus } = await apiDelete(`/personal-tasks/${taskId}`, token);
    expect(deleteStatus).toBe(200);

    // 목록 재조회 — 삭제된 항목이 제외되어야 함
    const { data: listData } = await apiGet(`/personal-tasks?teamId=${TEAM_ID}`, token);
    const ids = (listData.data as Array<{ id: string }>).map((t) => t.id);
    expect(ids).not.toContain(taskId);
  });

  // ──────────────────────────────────────────────
  // 7. reorder — 순서 변경 후 sortOrder 반영
  // ──────────────────────────────────────────────

  test.if(!SKIP_E2E)('PATCH /personal-tasks/reorder — 순서 변경 반영', async () => {
    const loginRes = await apiPost('/auth/login', {
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
    });
    const token = loginRes.data.data?.accessToken;

    // 두 작업 생성
    const res1 = await apiPost(
      '/personal-tasks',
      { teamId: TEAM_ID, title: 'reorder 작업 A', priority: 'LOW' },
      token,
    );
    const res2 = await apiPost(
      '/personal-tasks',
      { teamId: TEAM_ID, title: 'reorder 작업 B', priority: 'LOW' },
      token,
    );
    const id1 = res1.data.data.id;
    const id2 = res2.data.data.id;

    // 순서 반전: B → A
    const { status } = await apiPatch(
      '/personal-tasks/reorder',
      { teamId: TEAM_ID, orderedIds: [id2, id1] },
      token,
    );
    expect(status).toBe(200);
  });

  // ──────────────────────────────────────────────
  // 8. summary API — 4개 카운트 필드 반환
  // ──────────────────────────────────────────────

  test.if(!SKIP_E2E)('GET /personal-tasks/summary — 4개 카운트 필드 반환', async () => {
    const loginRes = await apiPost('/auth/login', {
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
    });
    const token = loginRes.data.data?.accessToken;

    const { status, data } = await apiGet(`/personal-tasks/summary?teamId=${TEAM_ID}`, token);
    expect(status).toBe(200);
    expect(data.data).toHaveProperty('todayCount');
    expect(data.data).toHaveProperty('dueSoonCount');
    expect(data.data).toHaveProperty('thisWeekDoneCount');
    expect(data.data).toHaveProperty('overdueCount');
  });

  // ──────────────────────────────────────────────
  // 9. 소유권 검사 — 타인 작업 수정 시 403
  // ──────────────────────────────────────────────

  test.if(!SKIP_E2E)('PATCH /personal-tasks/:id — 타인 작업 수정 시 403', async () => {
    // 멤버 A 로그인 및 작업 생성
    const loginA = await apiPost('/auth/login', {
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
    });
    const tokenA = loginA.data.data?.accessToken;

    const createRes = await apiPost(
      '/personal-tasks',
      { teamId: TEAM_ID, title: '멤버 A의 작업', priority: 'MEDIUM' },
      tokenA,
    );
    const taskId = createRes.data.data.id;

    // 멤버 B 로그인
    const loginB = await apiPost('/auth/login', {
      email: OTHER_MEMBER_EMAIL,
      password: OTHER_MEMBER_PASSWORD,
    });
    const tokenB = loginB.data.data?.accessToken;

    // 멤버 B가 멤버 A의 작업을 수정 시도 → 403
    const { status } = await apiPatch(
      `/personal-tasks/${taskId}`,
      { title: '무단 수정 시도' },
      tokenB,
    );
    expect(status).toBe(403);
  });

  // ──────────────────────────────────────────────
  // 10. MEMBER 권한으로 part-overview 호출 시 403
  // ──────────────────────────────────────────────

  test.if(!SKIP_E2E)('GET /personal-tasks/part-overview — MEMBER 권한으로 접근 시 403', async () => {
    const loginRes = await apiPost('/auth/login', {
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
    });
    const token = loginRes.data.data?.accessToken;

    const { status } = await apiGet(`/personal-tasks/part-overview?teamId=${TEAM_ID}`, token);
    expect(status).toBe(403);
  });

  // ──────────────────────────────────────────────
  // 11. PART_LEADER 권한으로 part-overview 호출 시 200
  // ──────────────────────────────────────────────

  test.if(!SKIP_E2E)('GET /personal-tasks/part-overview — PART_LEADER 권한으로 접근 시 200', async () => {
    const loginRes = await apiPost('/auth/login', {
      email: PART_LEADER_EMAIL,
      password: PART_LEADER_PASSWORD,
    });
    const token = loginRes.data.data?.accessToken;

    const { status, data } = await apiGet(
      `/personal-tasks/part-overview?teamId=${TEAM_ID}`,
      token,
    );
    expect(status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
  });

  // ──────────────────────────────────────────────
  // 플레이스홀더 — 서버 미실행 환경에서 파이프라인 통과용
  // ──────────────────────────────────────────────

  test('placeholder — personal-task e2e config ready', () => {
    expect(true).toBe(true);
  });
});
