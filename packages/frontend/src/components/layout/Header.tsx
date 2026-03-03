import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: '대시보드',
    subtitle: '주간 업무 현황을 한눈에 확인합니다',
  },
  '/my-weekly': {
    title: '내 주간업무',
    subtitle: '이번 주 업무를 작성하고 제출합니다',
  },
  '/part-status': {
    title: '업무현황',
    subtitle: '파트 및 팀 구성원의 주간 업무 현황을 확인합니다',
  },
  '/report-consolidation': {
    title: '보고서 취합',
    subtitle: '팀원 업무를 취합하여 보고서를 작성합니다',
  },
  '/team-mgmt': {
    title: '팀·파트 관리',
    subtitle: '팀, 파트, 팀원 정보를 관리합니다',
  },
  '/project-mgmt': {
    title: '프로젝트 관리',
    subtitle: '프로젝트 목록을 등록하고 관리합니다',
  },
  '/guide': {
    title: '사용가이드',
    subtitle: '역할별 시스템 사용 방법을 안내합니다',
  },
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const day = DAY_LABELS[date.getDay()];
  return `${y}.${m}.${d} (${day})`;
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const pageInfo = PAGE_TITLES[location.pathname] ?? {
    title: 'UC TeamSpace',
    subtitle: '',
  };
  const today = formatDate(new Date());

  return (
    <header
      className="bg-white flex items-center justify-between px-6 flex-shrink-0"
      style={{
        height: 'var(--header-h)',
        borderBottom: '1px solid var(--gray-border)',
      }}
    >
      {/* 좌측: 페이지 제목 + 서브타이틀 */}
      <div className="flex flex-col justify-center">
        <h1 className="text-[15px] font-bold leading-tight" style={{ color: 'var(--text)' }}>
          {pageInfo.title}
        </h1>
        {pageInfo.subtitle && (
          <p className="text-[12px] leading-tight mt-0.5" style={{ color: 'var(--text-sub)' }}>
            {pageInfo.subtitle}
          </p>
        )}
      </div>

      {/* 우측: 사용가이드 + pulse dot + 날짜(요일) */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guide')}
          className="flex items-center gap-1 px-2 py-1 rounded text-[12px] transition-colors hover:opacity-80"
          style={{ color: 'var(--primary)' }}
        >
          <BookOpen size={14} />
          사용가이드
        </button>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-[6px] h-[6px] rounded-full animate-pulse flex-shrink-0"
            style={{ backgroundColor: 'var(--ok)' }}
          />
          <span className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
            {today}
          </span>
        </div>
      </div>
    </header>
  );
}
