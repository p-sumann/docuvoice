export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type FindingType =
  | "discrepancy"
  | "anomaly"
  | "exposure"
  | "missing"
  | "red_flag";

export interface Finding {
  id: string;
  sessionId: string;
  workspaceId: string;
  type: FindingType;
  severity: FindingSeverity;
  title: string;
  description: string;
  documentRefs: string[];
  fieldRefs: string[];
  confidence: number;
  createdAt: string;
}
