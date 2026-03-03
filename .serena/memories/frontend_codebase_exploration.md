# Frontend Codebase Exploration - Complete Findings

## 1. Header Component Structure

**File**: `C:\rnd\weekly-report\packages\frontend\src\components\layout\Header.tsx`

### Key Structure:
- **Simple header component** with two sections:
  - **Left side**: Page title + subtitle (dynamically set based on current route)
  - **Right side**: Pulse indicator dot + current date/weekday (currently NO menu items)

### Current Right Side Code (lines 71-79):
```tsx
<div className="flex items-center gap-2">
  <span
    className="inline-block w-[6px] h-[6px] rounded-full animate-pulse flex-shrink-0"
    style={{ backgroundColor: 'var(--ok)' }}
  />
  <span className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
    {today}
  </span>
</div>
```

### Where to Add Menu Items:
The right-side `<div>` can be extended with additional navigation items (Help/Guide button would fit here perfectly).

---

## 2. Routing Structure

**File**: `C:\rnd\weekly-report\packages\frontend\src\App.tsx`

### Key Points:
- **AppLayout** (regular users) contains:
  - `/teams` - Team selection
  - `/` - Dashboard
  - `/my-weekly` - Weekly report
  - `/part-status` - Part status (role-guarded: LEADER, PART_LEADER)
  - `/report-consolidation` - Report consolidation (role-guarded)
  - `/team-mgmt` - Team management (role-guarded: LEADER only)
  - `/project-mgmt` - Project management (role-guarded: LEADER only)

- **AdminLayout** (ADMIN users only) contains:
  - `/admin` → `/admin/accounts`
  - `/admin/teams`
  - `/admin/projects`

### How to Add /guide Route:
```tsx
<Route path="/guide" element={<GuideComponent />} />
// OR with role-guard if needed
<Route path="/guide" element={
  <RoleGuard roles={['LEADER', 'PART_LEADER', 'MEMBER']}>
    <GuideComponent />
  </RoleGuard>
} />
```

---

## 3. Auth Store & User Roles

**File**: `C:\rnd\weekly-report\packages\frontend\src\stores\authStore.ts`

### User Interface:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  roles: ('ADMIN' | 'LEADER' | 'PART_LEADER' | 'MEMBER')[];
  partId: string;
  partName: string;
  teamId: string;
  teamName: string;
  mustChangePassword?: boolean;
}
```

### Access in Components:
```tsx
const { user } = useAuthStore();
// Check role:
if (user?.roles.includes('LEADER')) { ... }
```

### Roles for Guide Content:
- **ADMIN**: System administrator (separate AdminLayout)
- **LEADER**: Team lead (full team visibility)
- **PART_LEADER**: Part/subteam lead (part-level visibility)
- **MEMBER**: Regular team member (personal only)

---

## 4. Public Directory

**Location**: `C:\rnd\weekly-report\packages\frontend\public\`

### Status: **EMPTY** (no files currently)

Screenshots can be placed here and referenced in:
```tsx
<img src="/screenshot-name.png" alt="..." />
```

---

## 5. Seed Data & Test Accounts

**File**: `C:\rnd\weekly-report\packages\backend\prisma\seed.ts`

### Test Account Credentials:

| Role | Name | Email | Password |
|------|------|-------|----------|
| ADMIN | 시스템관리자 | admin@system.local | password123 |
| LEADER (팀장) | 홍길동 | leader@example.com | password123 |
| PART_LEADER (파트장) | 최수진 | ax.partleader@example.com | password123 |
| MEMBER (팀원) | 김철수 | dx.member1@example.com | password123 |
| MEMBER (팀원) | 정하늘 | ax.member1@example.com | password123 |

### Team Structure:
- **Team**: 선행연구개발팀
- **Parts**:
  - DX (4 members: 1 LEADER, 3 MEMBERS)
  - AX (5 members: 1 PART_LEADER, 4 MEMBERS)

### Sample Projects:
11 projects total (3 COMMON + 8 EXECUTION)

---

## 6. Existing Playwright Setup

**File**: `C:\rnd\weekly-report\packages\frontend\playwright.config.ts`

### Configuration:
```typescript
// Base configuration
testDir: './e2e'
baseURL: 'http://localhost:5173' (or E2E_BASE_URL env var)
browser: Chromium
reporter: 'html'
workers: 1 (no parallelization)
screenshot: 'only-on-failure'
trace: 'on-first-retry'

// Web server NOT auto-started (manual run required)
```

### Existing E2E Tests:
```
packages/frontend/e2e/
├── 01-auth.spec.ts           # Login, role-based access tests
├── 02-weekly-report.spec.ts
└── 03-part-summary.spec.ts
```

### Example Test Pattern (01-auth.spec.ts):
```typescript
test('로그인 페이지 렌더링', async ({ page }) => {
  await page.goto(BASE_URL + '/login');
  await expect(page.getByText('주간업무보고 시스템')).toBeVisible({ timeout: 5000 });
});

test('로그인 + 로그아웃', async ({ page }) => {
  // Fill login form
  // Click login button
  // Verify redirect to /teams or /
  // Click logout
  // Verify return to /login
});
```

---

## 7. Layout Components

### AppLayout.tsx
- Main layout for authenticated users (non-admin)
- Contains Sidebar + Header + content outlet
- Auto-redirects to /teams if no team selected (except for ADMIN)
- Manages team store synchronization

### Sidebar.tsx
- Left navigation with role-based menu items
- Profile dropdown at bottom with:
  - User avatar (first initial)
  - User name
  - Current team + role
  - Team switcher (if user belongs to multiple teams)
  - Password change button
  - Logout button
- Menu items have hover effects with CSS variables

### Header.tsx
- Simple header with:
  - Dynamic page title + subtitle based on route
  - Right side: pulse dot + date (EXTENSIBLE - can add menu items here)

### AdminLayout.tsx
- Similar structure to AppLayout but for ADMIN users only
- Admin-specific sidebar with 3 menu items (accounts, teams, projects)
- "Return to normal view" button
- Different logo emoji: 🛡️ (shield) vs 📋 (clipboard)

---

## 8. Key Observations for Guide Implementation

1. **Header Right Side**: Already has flex container (gap-2) - can add menu items before the date
2. **No explicit menu system**: Navigation is sidebar-only; header can have action buttons
3. **Role detection**: Simple `user?.roles.includes('ROLE')` pattern
4. **CSS variables used**: `--primary`, `--text`, `--text-sub`, `--gray-border`, etc.
5. **Tailwind + inline styles hybrid**: Mix of Tailwind classes + CSS variables
6. **Icon library**: lucide-react (used for sidebar icons)
7. **Routing**: React Router v7 with nested routes and RoleGuard component

---

## Summary for Development

### What to Create:
1. **New /guide route** in App.tsx (AppLayout wrapper)
2. **GuidePage.tsx component** with role-based sections
3. **Help/Guide button** in Header right side (or Sidebar)
4. **Screenshot assets** in public/ folder
5. **Playwright test** for guide page navigation + role-based content visibility

### Button Styling to Match:
```tsx
// Based on Sidebar button pattern
className="flex items-center gap-2 text-[12px] px-4 py-[7px] transition-colors"
style={{ color: 'var(--text-sub)' }}
// On hover: background 'rgba(37, 45, 72, 0.1)', color #c0c8e0
```

### Where to Add Button:
**Option 1**: Header right side (most prominent)
**Option 2**: Sidebar as last menu item
**Option 3**: Both (header for quick access, sidebar in menu)
