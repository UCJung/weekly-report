export type MemberRole = 'ADMIN' | 'LEADER' | 'PART_LEADER' | 'MEMBER';

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Part {
  id: string;
  name: string;
  teamId: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  partId: string;
  isActive: boolean;
  position?: string | null;
  jobTitle?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
