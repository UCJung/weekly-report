export type ProjectCategory = 'COMMON' | 'EXECUTION';
export type ProjectStatus = 'ACTIVE' | 'INACTIVE';

export interface Project {
  id: string;
  name: string;
  code: string;
  category: ProjectCategory;
  status: ProjectStatus;
  teamId: string;
}
