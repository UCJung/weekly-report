import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

const PAGE_TITLES: Record<string, { title: string; subtitle: string; guideTab: string }> = {
  '/': {
    title: '대시보드',
    subtitle: '주간 업무 현황을 한눈에 확인합니다',
    guideTab: 'start',
  },
  '/my-weekly': {
    title: '내 주간업무',
    subtitle: '이번 주 업무를 작성하고 제출합니다',
    guideTab: 'member',
  },
  '/timesheet': {
    title: '근무시간표',
    subtitle: '월별 근무시간을 입력하고 제출합니다',
    guideTab: 'member',
  },
  '/timesheet/team-review': {
    title: '팀 근무시간 검토',
    subtitle: '팀원의 근무시간표를 검토하고 승인합니다',
    guideTab: 'leader',
  },
  '/timesheet/project-allocation': {
    title: '프로젝트 투입현황',
    subtitle: '프로젝트별 인원 투입 현황을 확인합니다',
    guideTab: 'leader',
  },
  '/part-status': {
    title: '업무현황',
    subtitle: '파트 및 팀 구성원의 주간 업무 현황을 확인합니다',
    guideTab: 'part-leader',
  },
  '/report-consolidation': {
    title: '보고서 취합',
    subtitle: '팀원 업무를 취합하여 보고서를 작성합니다',
    guideTab: 'part-leader',
  },
  '/team-mgmt': {
    title: '팀·파트 관리',
    subtitle: '팀, 파트, 팀원 정보를 관리합니다',
    guideTab: 'leader',
  },
  '/project-mgmt': {
    title: '프로젝트 관리',
    subtitle: '프로젝트 목록을 등록하고 관리합니다',
    guideTab: 'leader',
  },
  '/guide': {
    title: '사용가이드',
    subtitle: '역할별 시스템 사용 방법을 안내합니다',
    guideTab: 'start',
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
    guideTab: 'start',
  };
  const today = formatDate(new Date());

  const handleHelp = () => {
    navigate(`/guide?tab=${pageInfo.guideTab}`);
  };

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
          <span className="text-[13px] font-normal" style={{ color: 'var(--text-sub)' }}>워크스페이스</span>
          <span className="text-[12px] mx-1.5 font-normal" style={{ color: 'var(--text-sub)' }}>&gt;</span>
          {pageInfo.title}
        </h1>
        {pageInfo.subtitle && (
          <p className="text-[12px] leading-tight mt-0.5" style={{ color: 'var(--text-sub)' }}>
            {pageInfo.subtitle}
          </p>
        )}
      </div>

      {/* 우측: 날짜 + 헬프 아이콘 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-[6px] h-[6px] rounded-full animate-pulse flex-shrink-0"
            style={{ backgroundColor: 'var(--ok)' }}
          />
          <span className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
            {today}
          </span>
        </div>
        <button
          onClick={handleHelp}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{
            color: 'var(--text-sub)',
            border: '1px solid var(--gray-border)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--primary-bg)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-border)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-sub)';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
          title="도움말"
        >
          <HelpCircle size={15} />
        </button>
      </div>
    </header>
  );
}
