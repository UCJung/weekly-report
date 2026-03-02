import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authApi.login(email.trim(), password);
      const { accessToken, refreshToken, user } = data.data;
      login(accessToken, refreshToken, user as Parameters<typeof login>[2]);

      if (user.mustChangePassword) {
        setShowChangePassword(true);
      } else if (user.roles?.includes('ADMIN')) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      if (axiosErr?.response?.data?.message) {
        setError(axiosErr.response.data.message);
      } else if (axiosErr?.response?.status === 401) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError(`로그인 실패: ${(err as Error)?.message ?? '알 수 없는 오류'}`);
      }
      console.error('[Login Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChanged = () => {
    setShowChangePassword(false);
    const { user } = useAuthStore.getState();
    navigate(user?.roles?.includes('ADMIN') ? '/admin' : '/');
  };

  return (
    <>
      <div className="flex h-screen w-full">
        {/* 좌측 패널 — Primary 배경 */}
        <div
          className="hidden md:flex md:w-1/2 flex-col items-center justify-center px-12 gap-8"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {/* 로고 영역 */}
          <div className="flex flex-col items-center gap-3 text-white">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-2xl text-3xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              📋
            </div>
            <h1 className="text-3xl font-bold tracking-tight">주간업무보고</h1>
            <p className="text-base opacity-80">선행연구개발팀 업무 현황을 한눈에</p>
          </div>

          {/* 기능 bullet */}
          <ul className="flex flex-col gap-3 w-full max-w-xs">
            {[
              { icon: '✏️', text: '팀원별 주간업무 작성 · 자동저장' },
              { icon: '📊', text: '파트 취합 및 팀장 현황 조회' },
              { icon: '📥', text: 'Excel 내보내기 지원' },
            ].map(({ icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-white text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
              >
                <span className="text-lg">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 우측 패널 — 로그인 폼 */}
        <div className="flex w-full md:w-1/2 flex-col items-center justify-center bg-white px-8">
          {/* 모바일 전용 타이틀 (md 이상에서는 숨김) */}
          <div className="flex flex-col items-center gap-1 mb-8 md:hidden">
            <span className="text-2xl">📋</span>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              주간업무보고
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-sub)' }}>
              선행연구개발팀
            </p>
          </div>

          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                로그인
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-sub)' }}>
                계정 정보를 입력하세요.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div
                  className="rounded-md px-4 py-3 text-sm"
                  style={{
                    backgroundColor: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    border: '1px solid var(--danger-bg)',
                  }}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full justify-center mt-1"
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-sub)' }}>
              계정이 없으신가요?{' '}
              <Link
                to="/register"
                className="font-medium hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                계정 신청
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 최초 로그인 강제 비밀번호 변경 모달 */}
      <ChangePasswordModal
        open={showChangePassword}
        onClose={handlePasswordChanged}
        forced
      />
    </>
  );
}
