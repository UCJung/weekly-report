import React from 'react';
import { Navigate, Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Users, Building2, FolderOpen, LogOut, ArrowLeft, Clock, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface AdminMenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  { path: '/admin/accounts', label: '계정 관리', icon: <Users size={14} /> },
  { path: '/admin/teams', label: '팀 관리', icon: <Building2 size={14} /> },
  { path: '/admin/projects', label: '프로젝트 관리', icon: <FolderOpen size={14} /> },
  { path: '/admin/timesheet', label: '근무시간표 관리', icon: <Clock size={14} /> },
];

const ADMIN_PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/admin/accounts': { title: '계정 관리', subtitle: '사용자 계정을 승인하고 상태를 관리합니다' },
  '/admin/teams': { title: '팀 관리', subtitle: '팀 생성 요청을 승인하고 상태를 관리합니다' },
  '/admin/projects': { title: '프로젝트 관리', subtitle: '시스템 전체 프로젝트를 등록하고 관리합니다' },
  '/admin/timesheet': { title: '근무시간표 관리', subtitle: '전체 팀의 근무시간표를 관리하고 최종 승인합니다' },
};

export default function AdminLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.roles.includes('ADMIN')) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name ? user.name.slice(0, 1) : '?';

  return (
    <div className="flex h-screen overflow-hidden w-full" style={{ backgroundColor: 'var(--gray-light)' }}>
      {/* 어드민 사이드바 */}
      <aside
        className="h-full flex flex-col z-30 flex-shrink-0"
        style={{
          width: 'var(--sidebar-w)',
          backgroundColor: '#181D2E',
        }}
      >
        {/* 로고 */}
        <div
          className="flex items-center px-4 gap-2"
          style={{
            height: 'var(--header-h)',
            borderBottom: '1px solid var(--sidebar-divider)',
          }}
        >
          <span className="text-[16px]">🛡️</span>
          <span className="text-white font-bold text-[13px] tracking-tight">시스템 관리</span>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="mb-1">
            <p
              className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.8px]"
              style={{ color: 'var(--sidebar-menu-title)' }}
            >
              관리 메뉴
            </p>
            {ADMIN_MENU_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-[9px] px-4 py-[7px] text-[12.5px] transition-colors duration-150 border-l-[3px]',
                    isActive
                      ? 'font-medium border-[var(--primary)]'
                      : 'border-transparent',
                  ].join(' ')
                }
                style={({ isActive }) => ({
                  color: isActive ? '#ffffff' : 'var(--sidebar-text)',
                  backgroundColor: isActive ? '#252D48' : 'transparent',
                })}
                onMouseEnter={(e) => {
                  const target = e.currentTarget;
                  if (!target.classList.contains('font-medium')) {
                    target.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    target.style.color = '#c0c8e0';
                  }
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget;
                  if (!target.classList.contains('font-medium')) {
                    target.style.backgroundColor = 'transparent';
                    target.style.color = 'var(--sidebar-text)';
                  }
                }}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* 일반 화면으로 돌아가기 */}
          <div className="mt-2">
            <p
              className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.8px]"
              style={{ color: 'var(--sidebar-menu-title)' }}
            >
              이동
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-[9px] px-4 py-[7px] text-[12.5px] border-l-[3px] border-transparent transition-colors duration-150"
              style={{ color: 'var(--sidebar-text)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.05)';
                (e.currentTarget as HTMLButtonElement).style.color = '#c0c8e0';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--sidebar-text)';
              }}
            >
              <ArrowLeft size={14} />
              <span>일반 화면으로</span>
            </button>
          </div>
        </nav>

        {/* 유저 프로필 + 로그아웃 */}
        {user && (
          <div
            className="px-4 py-3"
            style={{ borderTop: '1px solid var(--sidebar-divider)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[12px] font-medium truncate">{user.name}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--sidebar-text)' }}>
                  시스템 관리자
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-[11px] px-2 py-1.5 rounded transition-colors"
              style={{ color: 'var(--sidebar-text)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(231,76,60,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--sidebar-text)';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              <LogOut size={12} />
              <span>로그아웃</span>
            </button>
          </div>
        )}
      </aside>

      {/* 우측 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 어드민 헤더 */}
        <header
          className="bg-white flex items-center justify-between px-6 flex-shrink-0"
          style={{
            height: 'var(--header-h)',
            borderBottom: '1px solid var(--gray-border)',
          }}
        >
          <div className="flex flex-col justify-center">
            <h1 className="text-[15px] font-bold leading-tight" style={{ color: 'var(--text)' }}>
              <span className="text-[13px] font-normal" style={{ color: 'var(--text-sub)' }}>시스템관리</span>
              <span className="text-[12px] mx-1.5 font-normal" style={{ color: 'var(--text-sub)' }}>&gt;</span>
              {(ADMIN_PAGE_TITLES[location.pathname] ?? { title: '시스템 관리' }).title}
            </h1>
            <p className="text-[12px] leading-tight mt-0.5" style={{ color: 'var(--text-sub)' }}>
              {(ADMIN_PAGE_TITLES[location.pathname] ?? { subtitle: '시스템을 관리합니다' }).subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="px-2 py-1 rounded text-[11px] font-semibold"
              style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' }}
            >
              ADMIN
            </div>
            <button
              onClick={() => navigate('/guide?tab=admin')}
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

        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
