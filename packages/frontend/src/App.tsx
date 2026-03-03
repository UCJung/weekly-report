import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import MyWeeklyReport from './pages/MyWeeklyReport';
import PartStatus from './pages/PartStatus';
import ReportConsolidation from './pages/ReportConsolidation';
import TeamMgmt from './pages/TeamMgmt';
import ProjectMgmt from './pages/ProjectMgmt';
import UserGuide from './pages/UserGuide';
import AccountManagement from './pages/admin/AccountManagement';
import TeamManagement from './pages/admin/TeamManagement';
import ProjectManagement from './pages/admin/ProjectManagement';
import TeamLanding from './pages/TeamLanding';
import MyTimesheet from './pages/MyTimesheet';
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function RoleGuard({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user || !user.roles.some((r) => roles.includes(r))) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          {/* 로그인 / 계정 신청 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 인증 필요 라우트 */}
          <Route element={<AppLayout />}>
            {/* 팀 선택 화면 */}
            <Route path="/teams" element={<TeamLanding />} />

            {/* 메인 화면 */}
            <Route index element={<Dashboard />} />
            <Route path="/my-weekly" element={<MyWeeklyReport />} />
            <Route path="/timesheet" element={<MyTimesheet />} />
            <Route
              path="/part-status"
              element={
                <RoleGuard roles={['LEADER', 'PART_LEADER']}>
                  <PartStatus />
                </RoleGuard>
              }
            />
            <Route
              path="/report-consolidation"
              element={
                <RoleGuard roles={['LEADER', 'PART_LEADER']}>
                  <ReportConsolidation />
                </RoleGuard>
              }
            />
            <Route
              path="/team-mgmt"
              element={
                <RoleGuard roles={['LEADER']}>
                  <TeamMgmt />
                </RoleGuard>
              }
            />
            <Route
              path="/project-mgmt"
              element={
                <RoleGuard roles={['LEADER']}>
                  <ProjectMgmt />
                </RoleGuard>
              }
            />
            <Route path="/guide" element={<UserGuide />} />
          </Route>

          {/* 어드민 라우트 */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/accounts" replace />} />
            <Route path="/admin/accounts" element={<AccountManagement />} />
            <Route path="/admin/teams" element={<TeamManagement />} />
            <Route path="/admin/projects" element={<ProjectManagement />} />
          </Route>

          {/* 404 처리 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
