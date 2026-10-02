export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}
