import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Plus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTeams, useMyTeams, useRequestJoinTeam } from '../hooks/useTeams';
import { useTeamStore } from '../stores/teamStore';
import { TeamFilter, TeamListItem } from '../api/team.api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import TeamCreateRequestModal from '../components/ui/TeamCreateRequestModal';

export default function TeamLanding() {
  const navigate = useNavigate();
  const { setCurrentTeamId } = useTeamStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TeamFilter>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: teams = [], isLoading } = useTeams({ search: search || undefined, filter });
  const { data: myTeams = [] } = useMyTeams();
  const { mutate: requestJoin, isPending: isJoining } = useRequestJoinTeam();

  const handleSelectTeam = useCallback(
    (teamId: string) => {
      setCurrentTeamId(teamId);
      navigate('/');
    },
    [setCurrentTeamId, navigate],
  );

  const handleJoinRequest = useCallback(
    (teamId: string, teamName: string) => {
      requestJoin(teamId, {
        onSuccess: () => {
          toast.success(`"${teamName}" 팀 가입 신청이 완료되었습니다.`);
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            '가입 신청에 실패했습니다.';
          toast.error(msg);
        },
      });
    },
    [requestJoin],
  );

  const FILTER_TABS: { key: TeamFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'joined', label: '소속팀' },
    { key: 'unjoined', label: '미소속팀' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start pt-12 px-4"
      style={{ backgroundColor: 'var(--gray-light)' }}
    >
      {/* 헤더 영역 */}
      <div className="w-full max-w-[720px] mb-8 text-center">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
          style={{ backgroundColor: 'var(--primary-bg)' }}
        >
          <Users size={22} style={{ color: 'var(--primary)' }} />
        </div>
        <h1 className="text-[22px] font-bold mb-2" style={{ color: 'var(--text)' }}>
          팀 선택
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-sub)' }}>
          업무를 진행할 팀을 선택하거나, 새 팀 생성을 신청하세요.
        </p>
      </div>

      {/* 내 소속팀 빠른 선택 */}
      {myTeams.length > 0 && (
        <div className="w-full max-w-[720px] mb-6">
          <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--text-sub)' }}>
            내 소속팀
          </p>
          <div className="flex flex-wrap gap-2">
            {myTeams.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTeam(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] font-medium transition-all"
                style={{
                  backgroundColor: 'white',
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'var(--primary-bg)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
                }}
              >
                <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 검색 + 필터 + 팀 생성 신청 */}
      <div className="w-full max-w-[720px] flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-sub)' }}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="팀명으로 검색..."
            className="pl-8"
          />
        </div>

        <div
          className="flex rounded-md overflow-hidden border"
          style={{ borderColor: 'var(--gray-border)' }}
        >
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="px-3 py-[7px] text-[12px] font-medium transition-colors"
              style={{
                backgroundColor:
                  filter === tab.key ? 'var(--primary)' : 'white',
                color: filter === tab.key ? 'white' : 'var(--text-sub)',
                borderRight: tab.key !== 'unjoined' ? '1px solid var(--gray-border)' : undefined,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          icon={<Plus size={13} />}
          onClick={() => setCreateModalOpen(true)}
        >
          팀 생성 신청
        </Button>
      </div>

      {/* 팀 목록 */}
      <div className="w-full max-w-[720px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : teams.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl border"
            style={{ backgroundColor: 'white', borderColor: 'var(--gray-border)' }}
          >
            <Users size={32} style={{ color: 'var(--text-sub)' }} className="mb-3" />
            <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text)' }}>
              팀이 없습니다
            </p>
            <p className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
              {search
                ? `"${search}"에 해당하는 팀을 찾을 수 없습니다.`
                : filter === 'joined'
                ? '소속된 팀이 없습니다.'
                : '등록된 팀이 없습니다. 팀 생성을 신청하세요.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {teams.map((team: TeamListItem) => (
              <div
                key={team.id}
                className="flex items-center justify-between px-5 py-4 rounded-xl border bg-white transition-shadow hover:shadow-sm"
                style={{ borderColor: 'var(--gray-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    {team.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                        {team.name}
                      </span>
                      {team.isMember && (
                        <Badge variant="purple">소속</Badge>
                      )}
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-sub)' }}>
                      {team.leaderName ? `팀장: ${team.leaderName}` : '팀장 미지정'}
                      {' · '}
                      {team.memberCount}명
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {team.isMember ? (
                    <>
                      <span
                        className="text-[12px] font-medium px-2"
                        style={{ color: 'var(--ok)' }}
                      >
                        소속됨
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelectTeam(team.id)}
                      >
                        선택
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleJoinRequest(team.id, team.name)}
                      disabled={isJoining}
                    >
                      멤버 신청
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 팀 생성 신청 모달 */}
      <TeamCreateRequestModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
