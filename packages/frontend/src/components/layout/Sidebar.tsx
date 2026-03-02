import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileEdit,
  ClipboardList,
  Users,
  FileText,
  FileSearch,
  Settings,
  FolderOpen,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
  roles?: string[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    title: '업무관리',
    items: [
      { path: '/', label: '대시보드', icon: <LayoutDashboard size={14} /> },
      { path: '/my-weekly', label: '내 주간업무', icon: <FileEdit size={14} /> },
      { path: '/my-history', label: '업무 이력', icon: <ClipboardList size={14} /> },
    ],
  },
  {
    title: '파트 관리',
    roles: ['LEADER', 'PART_LEADER'],
    items: [
      {
        path: '/part-status',
        label: '업무현황',
        icon: <Users size={14} />,
        roles: ['LEADER', 'PART_LEADER'],
      },
      {
        path: '/part-summary',
        label: '파트 취합보고서',
        icon: <FileText size={14} />,
        roles: ['LEADER', 'PART_LEADER'],
      },
    ],
  },
  {
    title: '팀 관리',
    roles: ['LEADER'],
    items: [
      {
        path: '/team-summary',
        label: '취합보고서 조회',
        icon: <FileSearch size={14} />,
        roles: ['LEADER'],
      },
    ],
  },
  {
    title: '설정',
    roles: ['LEADER'],
    items: [
      {
        path: '/team-mgmt',
        label: '팀·파트 관리',
        icon: <Settings size={14} />,
        roles: ['LEADER'],
      },
      {
        path: '/project-mgmt',
        label: '프로젝트 관리',
        icon: <FolderOpen size={14} />,
        roles: ['LEADER'],
      },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  LEADER: '팀장',
  PART_LEADER: '파트장',
  MEMBER: '팀원',
};

// 최고 역할 우선순위: LEADER > PART_LEADER > MEMBER
function getPrimaryRole(roles: string[]): string {
  if (roles.includes('LEADER')) return 'LEADER';
  if (roles.includes('PART_LEADER')) return 'PART_LEADER';
  return roles[0] ?? 'MEMBER';
}

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const canAccess = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    if (!user) return false;
    return user.roles.some((r) => roles.includes(r));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name ? user.name.slice(0, 1) : '?';
  const primaryRole = user ? getPrimaryRole(user.roles) : 'MEMBER';

  return (
    <aside
      className="h-full flex flex-col z-30 flex-shrink-0"
      style={{
        width: 'var(--sidebar-w)',
        backgroundColor: '#181D2E',
      }}
    >
      {/* 로고 */}
      <div
        className="flex items-center px-4 cursor-pointer gap-2"
        style={{
          height: 'var(--header-h)',
          borderBottom: '1px solid var(--sidebar-divider)',
        }}
        onClick={() => navigate('/')}
      >
        <span className="text-[16px]">📋</span>
        <span className="text-white font-bold text-[13px] tracking-tight">주간업무보고</span>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {MENU_GROUPS.map((group) => {
          if (!canAccess(group.roles)) return null;

          const visibleItems = group.items.filter((item) => canAccess(item.roles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-1">
              <p
                className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.8px]"
                style={{ color: 'var(--sidebar-menu-title)' }}
              >
                {group.title}
              </p>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
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
          );
        })}
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
                {user.partName} · {ROLE_LABELS[primaryRole] ?? primaryRole}
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
  );
}
