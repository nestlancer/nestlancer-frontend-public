/** Backend normalizes statuses to camelCase (e.g. draft, underReview, closed). */
export type RequestStatus = string;

export interface ProjectRequestSummary {
  id: string;
  title: string;
  status: RequestStatus;
  category?: string;
  createdAt: string;
  submittedAt?: string | null;
}

export interface ProjectRequest extends ProjectRequestSummary {
  description: string;
  clientId?: string;
  userId?: string;
}

export interface CreateRequestPayload {
  title: string;
  description: string;
  category: string;
  budget: { min: number; max: number; currency: string; flexible: boolean };
  timeline: { preferredStartDate: string; deadline: string; flexible: boolean };
  requirements: string[];
  technicalRequirements?: {
    preferredTechnologies?: string[];
    hosting?: string;
    integrations?: string[];
  };
  attachments?: string[];
  additionalInfo?: string;
}

export interface RequestAttachment {
  id: string;
  filename?: string;
  url?: string;
  type?: string;
  size?: number;
}

export interface RequestQuoteSummary {
  id: string;
  status: string;
  totalAmount?: number;
  createdAt?: string;
}

export interface RequestStatusHistoryEntry {
  status: string;
  timestamp: string;
  note?: string;
}

export interface RequestDetail extends ProjectRequestSummary {
  description: string;
  budget: { min: number; max: number; currency: string; flexible: boolean };
  timeline: { preferredStartDate: string; deadline: string; flexible: boolean };
  requirements: string[];
  technicalRequirements?: Record<string, unknown> | null;
  attachments: RequestAttachment[];
  quotes: RequestQuoteSummary[];
  statusHistory: RequestStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
}
