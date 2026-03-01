import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  roles?: string[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    title: '개인',
    items: [
      { path: '/', label: '대시보드', icon: '📊' },
      { path: '/my-weekly', label: '주간업무 작성', icon: '✏️' },
      { path: '/my-history', label: '내 이력', icon: '📋' },
    ],
  },
  {
    title: '파트',
    items: [
      {
        path: '/part-status',
        label: '파트 현황',
        icon: '👥',
        roles: ['LEADER', 'PART_LEADER'],
      },
      {
        path: '/part-summary',
        label: '취합보고',
        icon: '📑',
        roles: ['PART_LEADER'],
      },
    ],
  },
  {
    title: '팀',
    items: [
      {
        path: '/team-status',
        label: '팀 현황',
        icon: '🏢',
        roles: ['LEADER'],
      },
    ],
  },
  {
    title: '관리',
    items: [
      {
        path: '/team-mgmt',
        label: '팀 관리',
        icon: '⚙️',
        roles: ['LEADER'],
      },
      {
        path: '/project-mgmt',
        label: '프로젝트 관리',
        icon: '📁',
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

export default function Sidebar() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const canAccess = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    if (!user) return false;
    return roles.includes(user.role);
  };

  const initials = user?.name ? user.name.slice(0, 1) : '?';

  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        backgroundColor: 'var(--sidebar-bg)',
        flexShrink: 0,
      }}
      className="h-full flex flex-col z-30"
    >
      {/* 로고 */}
      <div
        className="flex items-center px-4 cursor-pointer"
        style={{
          height: 'var(--header-h)',
          borderBottom: '1px solid var(--sidebar-divider)',
        }}
        onClick={() => navigate('/')}
      >
        <span className="text-white font-bold text-[13px]">
          주간업무보고
        </span>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {MENU_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => canAccess(item.roles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-1">
              <p
                className="px-4 py-[8px] text-[10px] font-semibold uppercase tracking-[0.8px]"
                style={{ color: 'var(--sidebar-menu-title)', paddingTop: '8px', paddingBottom: '4px' }}
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
                        ? 'text-white font-medium border-[var(--primary)]'
                        : 'border-transparent hover:text-white',
                    ].join(' ')
                  }
                  style={({ isActive }) => ({
                    color: isActive ? '#ffffff' : 'var(--sidebar-text)',
                    backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
                  })}
                >
                  <span className="text-[14px] flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* 유저 프로필 */}
      {user && (
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderTop: '1px solid var(--sidebar-divider)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-medium truncate">{user.name}</p>
            <p className="text-[11px] truncate" style={{ color: 'var(--sidebar-text)' }}>
              {user.partName} · {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
