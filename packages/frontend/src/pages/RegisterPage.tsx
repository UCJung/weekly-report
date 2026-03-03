import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';

type Step = 'form' | 'done';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!name.trim()) return '성명을 입력하세요.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return '올바른 이메일 형식을 입력하세요.';
    if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
    if (password !== confirmPassword) return '비밀번호가 일치하지 않습니다.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.register({ name: name.trim(), email, password });
      setStep('done');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        '계정 신청에 실패했습니다. 잠시 후 다시 시도해 주세요.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* 좌측 패널 — Primary 배경 */}
      <div
        className="hidden md:flex md:w-1/2 flex-col items-center justify-center px-12 gap-8"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <div className="flex flex-col items-center gap-3 text-white">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl text-3xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            📋
          </div>
          <h1 className="text-3xl font-bold tracking-tight">UC TeamSpace</h1>
          <p className="text-base opacity-80">선행연구개발팀 업무 현황을 한눈에</p>
        </div>

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

      {/* 우측 패널 — 신청 폼 */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center bg-white px-8">
        {/* 모바일 전용 타이틀 */}
        <div className="flex flex-col items-center gap-1 mb-8 md:hidden">
          <span className="text-2xl">📋</span>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            UC TeamSpace
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-sub)' }}>
            선행연구개발팀
          </p>
        </div>

        <div className="w-full max-w-sm">
          {step === 'done' ? (
            <div className="flex flex-col items-center gap-6 text-center">
              <div
                className="flex items-center justify-center w-16 h-16 rounded-full text-3xl"
                style={{ backgroundColor: 'var(--ok-bg)' }}
              >
                ✅
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                  계정 신청 완료
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sub)' }}>
                  계정 신청이 완료되었습니다.
                  <br />
                  관리자 승인 후 로그인이 가능합니다.
                </p>
              </div>
              <Link
                to="/login"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                로그인 화면으로 돌아가기
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                  계정 신청
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-sub)' }}>
                  신청 후 관리자 승인을 받으면 로그인할 수 있습니다.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-name">성명</Label>
                  <Input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-email">이메일</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-password">비밀번호</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8자 이상 입력하세요"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-confirm">비밀번호 확인</Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    autoComplete="new-password"
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
                  {loading ? '신청 중...' : '계정 신청'}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-sub)' }}>
                이미 계정이 있으신가요?{' '}
                <Link
                  to="/login"
                  className="font-medium hover:underline"
                  style={{ color: 'var(--primary)' }}
                >
                  로그인
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
