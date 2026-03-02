import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'password123';

async function main() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 0. ADMIN 계정 생성
  const admin = await prisma.member.upsert({
    where: { email: 'admin@system.local' },
    update: { name: '시스템관리자', roles: { set: ['ADMIN'] } },
    create: {
      name: '시스템관리자',
      email: 'admin@system.local',
      password: hashedPassword,
      roles: ['ADMIN'],
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
      isActive: true,
    },
  });
  console.log(`ADMIN 생성: ${admin.name} (${admin.email})`);

  // 1. 팀 생성
  const team = await prisma.team.upsert({
    where: { name: '선행연구개발팀' },
    update: {},
    create: {
      name: '선행연구개발팀',
      description: '선행연구개발팀 주간업무보고 시스템',
      teamStatus: 'ACTIVE',
    },
  });
  console.log(`팀 생성: ${team.name} (${team.id})`);

  // 2. 파트 생성
  const dxPart = await prisma.part.upsert({
    where: { teamId_name: { teamId: team.id, name: 'DX' } },
    update: {},
    create: { name: 'DX', teamId: team.id },
  });

  const axPart = await prisma.part.upsert({
    where: { teamId_name: { teamId: team.id, name: 'AX' } },
    update: {},
    create: { name: 'AX', teamId: team.id },
  });
  console.log(`파트 생성: DX (${dxPart.id}), AX (${axPart.id})`);

  // 3. 팀원 생성
  const members = [
    // DX 파트
    { name: '홍길동', email: 'leader@example.com', roles: ['LEADER'] as const, partId: dxPart.id, sortOrder: 0 },
    { name: '김철수', email: 'dx.member1@example.com', roles: ['MEMBER'] as const, partId: dxPart.id, sortOrder: 1 },
    { name: '이영희', email: 'dx.member2@example.com', roles: ['MEMBER'] as const, partId: dxPart.id, sortOrder: 2 },
    { name: '박민수', email: 'dx.member3@example.com', roles: ['MEMBER'] as const, partId: dxPart.id, sortOrder: 3 },
    // AX 파트
    { name: '최수진', email: 'ax.partleader@example.com', roles: ['PART_LEADER'] as const, partId: axPart.id, sortOrder: 4 },
    { name: '정하늘', email: 'ax.member1@example.com', roles: ['MEMBER'] as const, partId: axPart.id, sortOrder: 5 },
    { name: '강서연', email: 'ax.member2@example.com', roles: ['MEMBER'] as const, partId: axPart.id, sortOrder: 6 },
    { name: '윤도현', email: 'ax.member3@example.com', roles: ['MEMBER'] as const, partId: axPart.id, sortOrder: 7 },
    { name: '한지우', email: 'ax.member4@example.com', roles: ['MEMBER'] as const, partId: axPart.id, sortOrder: 8 },
  ];

  for (const m of members) {
    const member = await prisma.member.upsert({
      where: { email: m.email },
      update: { name: m.name, roles: { set: m.roles }, partId: m.partId, sortOrder: m.sortOrder },
      create: {
        name: m.name,
        email: m.email,
        password: hashedPassword,
        roles: m.roles,
        partId: m.partId,
        sortOrder: m.sortOrder,
        accountStatus: 'ACTIVE',
        mustChangePassword: false,
      },
    });
    console.log(`팀원 생성: ${member.name} (${member.roles.join(', ')}) - ${member.email}`);

    // TeamMembership 생성
    await prisma.teamMembership.upsert({
      where: { memberId_teamId: { memberId: member.id, teamId: team.id } },
      update: { partId: m.partId, roles: { set: m.roles }, sortOrder: m.sortOrder },
      create: {
        memberId: member.id,
        teamId: team.id,
        partId: m.partId,
        roles: m.roles,
        sortOrder: m.sortOrder,
      },
    });
  }

  // 4. 프로젝트 생성
  const projects = [
    // 공통업무
    { name: '팀공통', code: '공통2500-팀', category: 'COMMON' as const },
    { name: 'DX공통', code: '공통2500-DX', category: 'COMMON' as const },
    { name: 'AX공통', code: '공통2500-AX', category: 'COMMON' as const },
    // 수행과제
    { name: '5G 1세부(현장수요)', code: '과제0013', category: 'EXECUTION' as const },
    { name: '5G 3세부(재난현장)', code: '과제0014', category: 'EXECUTION' as const },
    { name: '가상병원용인', code: '과제0023', category: 'EXECUTION' as const },
    { name: '비대면과제', code: '과제0024', category: 'EXECUTION' as const },
    { name: '스케일업팁스일산', code: '과제0026', category: 'EXECUTION' as const },
    { name: '질병관리청 AX', code: '과제0027', category: 'EXECUTION' as const },
    { name: '가상병원_한림(2025년)', code: 'HAX-의료-25004', category: 'EXECUTION' as const },
    { name: 'AI영상검사', code: '과제0011', category: 'EXECUTION' as const },
  ];

  for (const p of projects) {
    const project = await prisma.project.upsert({
      where: { teamId_code: { teamId: team.id, code: p.code } },
      update: { name: p.name, category: p.category },
      create: {
        name: p.name,
        code: p.code,
        category: p.category,
        teamId: team.id,
      },
    });
    console.log(`프로젝트 생성: ${project.name} (${project.code}) [${project.category}]`);
  }

  // 5. 주간업무보고 샘플 데이터 생성
  // 최근 4주치 (W09 ~ W12) 데이터 생성
  const allMembers = await prisma.member.findMany({
    where: { accountStatus: 'ACTIVE', roles: { hasSome: ['LEADER', 'PART_LEADER', 'MEMBER'] } },
    select: { id: true, name: true },
  });
  const allProjects = await prisma.project.findMany({
    where: { teamId: team.id, status: 'ACTIVE' },
    select: { id: true, name: true, code: true },
  });

  // 주차별 월요일 날짜 계산
  const weeks = [
    { label: '2026-W09', start: new Date('2026-02-23T00:00:00Z') },
    { label: '2026-W10', start: new Date('2026-03-02T00:00:00Z') },
  ];

  // 샘플 업무 텍스트
  const doneWorkSamples = [
    '[기능 개발]\n*로그인/회원가입 API 구현\nㄴJWT 토큰 발급 로직 완성\nㄴRefresh 토큰 Redis 저장 연동',
    '[UI 개발]\n*대시보드 화면 레이아웃 구현\nㄴ차트 컴포넌트 연동\n*사이드바 네비게이션 완성',
    '[데이터 분석]\n*수집 데이터 전처리 파이프라인 구축\nㄴ결측치 처리 로직 추가\n*분석 리포트 자동 생성 기능',
    '[시스템 설계]\n*아키텍처 설계 문서 작성\nㄴAPI 엔드포인트 정의\nㄴDB 스키마 설계 완료',
    '[테스트]\n*단위 테스트 작성 (커버리지 85%)\nㄴ인증 모듈 테스트\nㄴAPI 통합 테스트',
    '[배포/운영]\n*스테이징 환경 배포\nㄴDocker 이미지 빌드 최적화\n*모니터링 대시보드 설정',
    '[연구개발]\n*알고리즘 성능 개선 (정확도 92%→95%)\nㄴ하이퍼파라미터 튜닝\nㄴ학습 데이터 증강',
    '[문서화]\n*API 문서 업데이트\nㄴSwagger 자동 생성 설정\n*사용자 가이드 초안 작성',
    '[코드 리뷰]\n*PR 리뷰 5건 완료\nㄴ코드 스타일 통일 가이드 공유\n*리팩토링 포인트 정리',
  ];

  const planWorkSamples = [
    '[기능 개발]\n*주간업무 CRUD API 구현\nㄴ자동저장 로직 개발\n*전주 불러오기 기능',
    '[UI 개발]\n*주간업무 그리드 편집 화면\nㄴ셀 인라인 편집 구현\n*프로젝트 드롭다운 컴포넌트',
    '[데이터 분석]\n*실시간 데이터 수집 모듈 개발\nㄴ스트리밍 처리 파이프라인\n*시각화 대시보드 프로토타입',
    '[시스템 설계]\n*마이크로서비스 분리 설계\nㄴ이벤트 기반 통신 구조\nㄴ서비스 간 인증 체계',
    '[테스트]\n*E2E 테스트 시나리오 작성\nㄴPlaywright 설정\n*성능 테스트 기준 정의',
    '[배포/운영]\n*프로덕션 배포 준비\nㄴCI/CD 파이프라인 구축\n*롤백 전략 수립',
    '[연구개발]\n*새로운 모델 아키텍처 실험\nㄴTransformer 기반 접근\nㄴ비교 실험 설계',
    '[문서화]\n*기술 블로그 포스팅 작성\nㄴ아키텍처 결정 배경\n*팀 온보딩 문서 정리',
    '[코드 리뷰]\n*레거시 코드 리팩토링 계획\nㄴ의존성 분석\n*테스트 커버리지 목표 설정',
  ];

  const remarksSamples = [
    '일정 지연 없이 진행 중',
    '외부 API 응답 지연 이슈 모니터링 중',
    '디자인 확정 후 작업 예정',
    '성능 목표치 초과 달성',
    '',
    '타 팀 협업 일정 조율 필요',
    '추가 데이터 확보 필요',
    '',
    '코드 품질 개선 진행 중',
  ];

  function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickRandomSubset<T>(arr: T[], min: number, max: number): T[] {
    const count = min + Math.floor(Math.random() * (max - min + 1));
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  let reportCount = 0;
  let itemCount = 0;

  for (const week of weeks) {
    for (const member of allMembers) {
      // W09는 전원 SUBMITTED, W10는 랜덤 (DRAFT/SUBMITTED)
      const status = week.label === '2026-W09'
        ? 'SUBMITTED' as const
        : (Math.random() > 0.5 ? 'SUBMITTED' as const : 'DRAFT' as const);

      const report = await prisma.weeklyReport.upsert({
        where: { memberId_weekStart: { memberId: member.id, weekStart: week.start } },
        update: {},
        create: {
          memberId: member.id,
          weekStart: week.start,
          weekLabel: week.label,
          status,
        },
      });
      reportCount++;

      // 팀원당 2~4개 프로젝트 랜덤 선택하여 업무항목 생성
      const selectedProjects = pickRandomSubset(allProjects, 2, 4);

      for (let i = 0; i < selectedProjects.length; i++) {
        const proj = selectedProjects[i];
        await prisma.workItem.create({
          data: {
            weeklyReportId: report.id,
            projectId: proj.id,
            doneWork: pickRandom(doneWorkSamples),
            planWork: pickRandom(planWorkSamples),
            remarks: pickRandom(remarksSamples) || null,
            sortOrder: i,
          },
        });
        itemCount++;
      }
    }
    console.log(`주간보고 생성: ${week.label} (${allMembers.length}명, 상태: ${week.label === '2026-W09' ? '전원 제출' : '혼합'})`);
  }

  console.log(`주간보고 총 ${reportCount}건, 업무항목 총 ${itemCount}건 생성`);
  console.log('\n시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error('시드 실행 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
