export type WorkspaceStatus = "active" | "setup" | "archived" | "error";

export type DomainType =
  | "insurance_claims"
  | "legal_contracts"
  | "financial_dd"
  | "custom";

export type DocumentStatus = "uploading" | "processing" | "ready" | "error";

export type DocumentType =
  | "fnol"
  | "policy"
  | "medical_bill"
  | "police_report"
  | "contract"
  | "nda"
  | "balance_sheet"
  | "custom";

export type SessionChannel = "web" | "phone";

export interface Workspace {
  id: string;
  name: string;
  domain: DomainType;
  status: WorkspaceStatus;
  documentCount: number;
  sessionCount: number;
  findingCount: number;
  phoneNumber: string | null;
  lastCallAt: string | null;
  minutesUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  workspaceId: string;
  filename: string;
  documentType: DocumentType;
  status: DocumentStatus;
  s3Key: string;
  sizeBytes: number;
  sizeTokens: number;
  extractedFields: ExtractedField[];
  processingError: string | null;
  isReferenced: boolean;
  createdAt: string;
}

export interface ExtractedField {
  key: string;
  value: string;
  source: string;
  confidence: number;
  isAnomaly: boolean;
  anomalyReason: string | null;
}

export interface Session {
  id: string;
  workspaceId: string;
  channel: SessionChannel;
  callerId: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  findingCount: number;
  transcriptUrl: string | null;
}

export interface TranscriptEntry {
  id: string;
  role: "agent" | "user";
  text: string;
  timestamp: number;
  documentRef: string | null;
  toolCall: string | null;
}

export interface WorkspaceStats {
  totalWorkspaces: number;
  totalSessions: number;
  totalMinutesUsed: number;
}
