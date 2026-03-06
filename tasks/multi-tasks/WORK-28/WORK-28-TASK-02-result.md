# WORK-28-TASK-02 — 완료 보고서

## 요약
선택한 PersonalTask 목록의 내용을 WorkItem의 doneWork/planWork에 반영하는 API를 성공적으로 추가했습니다.

## 구현 내용

### 1. 새로운 파일

#### `packages/backend/src/weekly-report/dto/apply-tasks.dto.ts`
```typescript
export class ApplyTasksDto {
  @IsArray()
  @IsString({ each: true })
  taskIds: string[];

  @IsEnum(['replace', 'append'])
  appendMode: 'replace' | 'append';

  @IsString()
  teamId: string;
}
```

### 2. 수정 파일

#### `packages/backend/src/weekly-report/work-item.service.ts`
- `applyTasksToWorkItem()` 메서드 추가
- 로직:
  1. WorkItem 조회 및 권한 검증
  2. taskIds에 해당하는 PersonalTask 조회 (본인 소유 + 미삭제)
  3. taskStatus.category로 분류:
     - `COMPLETED` → doneWork
     - `IN_PROGRESS`, `BEFORE_START` → planWork
  4. 텍스트 생성 규칙:
     - `*작업제목`
     - memo가 있으면 `ㄴ메모내용` 추가
  5. appendMode에 따라 교체 또는 추가
  6. WorkItem 업데이트 후 반환

#### `packages/backend/src/weekly-report/report.controller.ts`
- `POST /api/v1/work-items/:id/apply-tasks` 엔드포인트 추가
- JWT 인증 가드 적용
- 본인 WorkItem만 수정 가능

### 3. 구현 세부사항

**카테고리별 분류:**
```typescript
const completedTasks = validTasks.filter(t => t.taskStatus.category === 'COMPLETED');
const planningTasks = validTasks.filter(
  t => t.taskStatus.category === 'IN_PROGRESS' || t.taskStatus.category === 'BEFORE_START'
);
```

**텍스트 포맷:**
```
*작업제목1
ㄴ메모내용 (memo가 있는 경우)
*작업제목2
```

**appendMode 처리:**
- `replace`: 기존 내용 완전 교체
- `append`: 기존 내용 뒤에 줄바꿈으로 추가

**응답:** 업데이트된 WorkItem 객체 (project 포함)

## 검증 결과

### 빌드
- ✅ `bun run build` 성공 (3개 패키지 모두 정상 빌드)
- ✅ TypeScript 타입 체크 통과

### 테스트
- ✅ 전체 192개 테스트 통과 (5.90초)
- ✅ 백엔드 기존 로직에 영향 없음

### 완료 기준 확인
- ✅ `POST /api/v1/work-items/:id/apply-tasks` 정상 동작
- ✅ `appendMode: 'replace'` 시 기존 내용 교체 (구현됨)
- ✅ `appendMode: 'append'` 시 기존 내용 뒤에 추가 (구현됨)
- ✅ COMPLETED 작업 → doneWork, 나머지 → planWork 분류 정확
- ✅ `bun run build` 오류 없음

## 기술적 구현 사항

- **DTO 검증**: class-validator로 taskIds 배열, appendMode enum 검증
- **카테고리 필터링**: taskStatus.category로 분류
- **순서 보존**: Map을 사용해 taskIds 순서대로 작업 매핑
- **텍스트 포맷팅**: memo 포함 여부에 따른 동적 형식
- **권한 검증**: findWorkItemAndVerify() 재사용

## 다음 단계

TASK-03 (프론트엔드: ExpandedEditor 연관 작업 패널)이 준비되었습니다.
