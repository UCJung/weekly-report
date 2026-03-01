import React from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const PAGE_TITLES: Record<string, string> = {
  '/': '대시보드',
  '/my-weekly': '주간업무 작성',
  '/my-history': '업무 이력',
  '/part-status': '파트 업무 현황',
  '/part-summary': '파트 취합보고',
  '/team-status': '팀 업무 현황',
  '/team-mgmt': '팀·파트·팀원 관리',
  '/project-mgmt': '프로젝트 관리',
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

export default function Header() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] ?? '주간업무보고';
  const today = formatDate(new Date());

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="bg-white flex items-center justify-between px-6 py-3 flex-shrink-0"
      style={{
        height: 'var(--header-h)',
        borderBottom: '1px solid var(--gray-border)',
      }}
    >
      <h1 className="text-[15px] font-bold text-[var(--text)]">{title}</h1>

      <div className="flex items-center gap-4">
        {/* 자동 갱신 pulse dot + 날짜 */}
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-[6px] h-[6px] rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--ok)' }}
          />
          <span className="text-[12px] text-[var(--text-sub)]">{today}</span>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="text-[11px] text-[var(--text-sub)] hover:text-[var(--danger)] transition-colors"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
