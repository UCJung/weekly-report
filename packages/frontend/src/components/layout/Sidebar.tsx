import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileEdit,
  Users,
  FileText,
  Settings,
  FolderOpen,
  LogOut,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Building2,
  HelpCircle,
  Clock,
  ClipboardCheck,
  BarChart3,
  CheckSquare,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTeamStore } from '../../stores/teamStore';
import { useMyTeams } from '../../hooks/useTeams';
import { useManagedProjects } from '../../hooks/useTimesheet';
import ChangePasswordModal from '../ui/ChangePasswordModal';

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
    title: '팀',
    items: [
      { path: '/teams', label: '팀 선택', icon: <Building2 size={14} /> },
    ],
  },
  {
    title: '업무관리',
    items: [
      { path: '/', label: '대시보드', icon: <LayoutDashboard size={14} /> },
      { path: '/my-weekly', label: '내 주간업무', icon: <FileEdit size={14} /> },
      { path: '/my-tasks', label: '내 작업', icon: <CheckSquare size={14} /> },
      { path: '/timesheet', label: '근무시간표', icon: <Clock size={14} /> },
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
        path: '/report-consolidation',
        label: '보고서 취합',
        icon: <FileText size={14} />,
        roles: ['LEADER', 'PART_LEADER'],
      },
      {
        path: '/timesheet/team-review',
        label: '시간표 취합',
        icon: <ClipboardCheck size={14} />,
        roles: ['LEADER'],
      },
    ],
  },
  {
    title: '설정',
    roles: ['LEADER', 'PART_LEADER'],
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
        roles: ['LEADER', 'PART_LEADER'],
      },
    ],
  },
  {
    title: '도움말',
    items: [
      { path: '/guide', label: '사용가이드', icon: <HelpCircle size={14} /> },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  LEADER: '팀장',
  PART_LEADER: '파트장',
  MEMBER: '팀원',
};

// ──────────── 공통 NavLink 래퍼 ────────────

interface SidebarNavLinkProps {
  path: string;
  label: string;
  icon: React.ReactNode;
}

function SidebarNavLink({ path, label, icon }: SidebarNavLinkProps) {
  return (
    <NavLink
      to={path}
      end={path === '/'}
      className={({ isActive }) =>
        [
          'flex items-center gap-[9px] px-4 py-[7px] text-[12.5px] transition-colors duration-150 border-l-[3px]',
          isActive ? 'font-medium border-[var(--primary)]' : 'border-transparent',
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
      <span className="flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

// 최고 역할 우선순위: LEADER > PART_LEADER > MEMBER
function getPrimaryRole(roles: string[]): string {
  if (roles.includes('LEADER')) return 'LEADER';
  if (roles.includes('PART_LEADER')) return 'PART_LEADER';
  return roles[0] ?? 'MEMBER';
}

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { currentTeamId, setCurrentTeamId } = useTeamStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const { data: myTeams = [] } = useMyTeams();
  const { data: managedProjects = [] } = useManagedProjects();

  const hasManagedProjects = managedProjects.length > 0;

  const canAccess = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    if (!user) return false;
    return user.roles.some((r) => roles.includes(r));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchTeam = (teamId: string) => {
    setCurrentTeamId(teamId);
    setProfileOpen(false);
    navigate('/');
  };

  const initials = user?.name ? user.name.slice(0, 1) : '?';
  const primaryRole = user ? getPrimaryRole(user.roles) : 'MEMBER';

  // 현재 선택된 팀 이름
  const currentTeam = myTeams.find((t) => t.id === currentTeamId);

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
        <span className="text-white font-bold text-[13px] tracking-tight">UC TeamSpace</span>
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
                <SidebarNavLink key={item.path} path={item.path} label={item.label} icon={item.icon} />
              ))}
            </div>
          );
        })}

        {/* PM 전용 메뉴: 관리 프로젝트 존재 시만 표시 */}
        {hasManagedProjects && (
          <div className="mb-1">
            <p
              className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.8px]"
              style={{ color: 'var(--sidebar-menu-title)' }}
            >
              PM
            </p>
            <SidebarNavLink
              path="/timesheet/project-allocation"
              label="프로젝트 투입현황"
              icon={<BarChart3 size={14} />}
            />
          </div>
        )}
      </nav>

      {/* 유저 프로필 + 팀 목록 + 로그아웃 */}
      {user && (
        <div
          className="flex flex-col"
          style={{ borderTop: '1px solid var(--sidebar-divider)' }}
        >
          {/* 프로필 토글 버튼 */}
          <button
            className="flex items-center gap-2 px-4 py-3 w-full text-left transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onClick={() => setProfileOpen((v) => !v)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
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
                {currentTeam?.name || user.teamName || '팀 미선택'}
                {' · '}
                {ROLE_LABELS[primaryRole] ?? primaryRole}
              </p>
            </div>
            {profileOpen ? (
              <ChevronUp size={12} style={{ color: 'var(--sidebar-text)', flexShrink: 0 }} />
            ) : (
              <ChevronDown size={12} style={{ color: 'var(--sidebar-text)', flexShrink: 0 }} />
            )}
          </button>

          {/* 확장 메뉴 */}
          {profileOpen && (
            <div
              className="flex flex-col py-1"
              style={{ borderTop: '1px solid var(--sidebar-divider)' }}
            >
              {/* 소속 팀 목록 */}
              {myTeams.length > 0 && (
                <>
                  <p
                    className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.8px]"
                    style={{ color: 'var(--sidebar-menu-title)' }}
                  >
                    소속 팀
                  </p>
                  {myTeams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => handleSwitchTeam(team.id)}
                      className="flex items-center gap-2 px-4 py-[7px] text-[12px] transition-colors w-full text-left"
                      style={{
                        color:
                          currentTeamId === team.id ? 'white' : 'var(--sidebar-text)',
                        backgroundColor:
                          currentTeamId === team.id ? '#252D48' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (currentTeamId !== team.id) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            'rgba(255,255,255,0.05)';
                          (e.currentTarget as HTMLButtonElement).style.color = '#c0c8e0';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentTeamId !== team.id) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            'transparent';
                          (e.currentTarget as HTMLButtonElement).style.color =
                            'var(--sidebar-text)';
                        }
                      }}
                    >
                      <Building2 size={12} className="flex-shrink-0" />
                      <span className="truncate">{team.name}</span>
                      {currentTeamId === team.id && (
                        <span
                          className="ml-auto text-[10px] font-semibold"
                          style={{ color: 'var(--sidebar-sub-active)' }}
                        >
                          현재
                        </span>
                      )}
                    </button>
                  ))}
                </>
              )}

              {/* 비밀번호 변경 */}
              <button
                onClick={() => {
                  setProfileOpen(false);
                  setChangePasswordOpen(true);
                }}
                className="flex items-center gap-2 text-[12px] px-4 py-[7px] transition-colors w-full text-left"
                style={{ color: 'var(--sidebar-text)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#c0c8e0';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--sidebar-text)';
                }}
              >
                <KeyRound size={12} />
                <span>비밀번호 변경</span>
              </button>

              {/* 로그아웃 */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-[12px] px-4 py-[7px] transition-colors w-full text-left"
                style={{ color: 'var(--sidebar-text)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'rgba(231,76,60,0.1)';
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
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </aside>
  );
}
