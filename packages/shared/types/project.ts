export type ProjectCategory = 'COMMON' | 'EXECUTION';
export type ProjectStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

export interface Project {
  id: string;
  name: string;
  code: string;
  category: ProjectCategory;
  status: ProjectStatus;
  teamId: string;
  managerId?: string | null;
  department?: string | null;
  description?: string | null;
}
