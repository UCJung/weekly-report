import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'password123';

async function main() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. 팀 생성
  const team = await prisma.team.upsert({
    where: { name: '선행연구개발팀' },
    update: {},
    create: {
      name: '선행연구개발팀',
      description: '선행연구개발팀 주간업무보고 시스템',
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
    { name: '정우철', email: 'wc.jung@example.com', role: 'LEADER' as const, partId: dxPart.id },
    { name: '이성전', email: 'sj.lee@example.com', role: 'MEMBER' as const, partId: dxPart.id },
    { name: '김영상', email: 'ys.kim@example.com', role: 'MEMBER' as const, partId: dxPart.id },
    { name: '권현하', email: 'hh.kwon@example.com', role: 'MEMBER' as const, partId: dxPart.id },
    // AX 파트
    { name: '문선홍', email: 'sh.moon@example.com', role: 'PART_LEADER' as const, partId: axPart.id },
    { name: '김지환', email: 'jh.kim@example.com', role: 'MEMBER' as const, partId: axPart.id },
    { name: '송하은', email: 'he.song@example.com', role: 'MEMBER' as const, partId: axPart.id },
    { name: '최혜주', email: 'hj.choi@example.com', role: 'MEMBER' as const, partId: axPart.id },
    { name: '정원희', email: 'wh.jung@example.com', role: 'MEMBER' as const, partId: axPart.id },
  ];

  for (const m of members) {
    const member = await prisma.member.upsert({
      where: { email: m.email },
      update: { name: m.name, role: m.role, partId: m.partId },
      create: {
        name: m.name,
        email: m.email,
        password: hashedPassword,
        role: m.role,
        partId: m.partId,
      },
    });
    console.log(`팀원 생성: ${member.name} (${member.role}) - ${member.email}`);
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
