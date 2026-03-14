import axios from "axios";

import type {
  Workspace,
  Document,
  ExtractedField,
  Session,
  TranscriptEntry,
  WorkspaceStats,
} from "@/types/workspace";
import type { Finding } from "@/types/finding";
import type { ApiResponse } from "@/types/api";
import type { SuggestedQuestion } from "@/types/voice";
import type { ModelConfig } from "@/types/settings";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

export { api };

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const { data } = await api.get<ApiResponse<Workspace[]>>("/api/v1/workspaces");
  return data.data;
}

export async function fetchWorkspace(id: string): Promise<Workspace | null> {
  try {
    const { data } = await api.get<ApiResponse<Workspace>>(
      `/api/v1/workspaces/${id}`
    );
    return data.data;
  } catch {
    return null;
  }
}

export async function createWorkspace(
  name: string,
  domain: string = "auto"
): Promise<Workspace> {
  const { data } = await api.post<ApiResponse<Workspace>>(
    "/api/v1/workspaces",
    { name, domain }
  );
  return data.data;
}

export async function fetchDocuments(workspaceId: string): Promise<Document[]> {
  const { data } = await api.get<ApiResponse<Document[]>>(
    `/api/v1/workspaces/${workspaceId}/documents`
  );
  return data.data;
}

export async function fetchExtractedFields(
  workspaceId: string
): Promise<ExtractedField[]> {
  const { data } = await api.get<ApiResponse<ExtractedField[]>>(
    `/api/v1/workspaces/${workspaceId}/extracted-fields`
  );
  return data.data;
}

export async function uploadDocument(
  workspaceId: string,
  file: File,
  documentType: string = "auto"
): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", documentType);

  const { data } = await api.post<ApiResponse<Document>>(
    `/api/v1/workspaces/${workspaceId}/documents/upload`,
    formData,
  );
  return data.data;
}

export async function fetchSessions(workspaceId: string): Promise<Session[]> {
  const { data } = await api.get<ApiResponse<Session[]>>(
    `/api/v1/workspaces/${workspaceId}/sessions`
  );
  return data.data;
}

export async function fetchSession(sessionId: string): Promise<Session | null> {
  try {
    const { data } = await api.get<ApiResponse<Session>>(
      `/api/v1/sessions/${sessionId}`
    );
    return data.data;
  } catch {
    return null;
  }
}

export async function fetchRecentSessions(limit: number = 3): Promise<Session[]> {
  try {
    const { data } = await api.get<ApiResponse<Session[]>>(
      `/api/v1/sessions/recent?limit=${limit}`
    );
    return data.data;
  } catch {
    return [];
  }
}

export async function fetchFindings(workspaceId: string): Promise<Finding[]> {
  const { data } = await api.get<ApiResponse<Finding[]>>(
    `/api/v1/workspaces/${workspaceId}/findings`
  );
  return data.data;
}

export async function fetchTranscript(
  sessionId: string
): Promise<TranscriptEntry[]> {
  const { data } = await api.get<ApiResponse<TranscriptEntry[]>>(
    `/api/v1/sessions/${sessionId}/transcript`
  );
  return data.data;
}

export async function fetchWorkspaceStats(): Promise<WorkspaceStats> {
  const { data } = await api.get<ApiResponse<WorkspaceStats>>(
    "/api/v1/workspaces/stats"
  );
  return data.data;
}

export async function fetchSuggestedQuestions(
  workspaceId: string
): Promise<SuggestedQuestion[]> {
  try {
    const { data } = await api.get<ApiResponse<SuggestedQuestion[]>>(
      `/api/v1/workspaces/${workspaceId}/suggested-questions`
    );
    return data.data;
  } catch {
    return [];
  }
}

export async function fetchModelConfig(): Promise<ModelConfig> {
  const { data } = await api.get<ApiResponse<ModelConfig>>(
    "/api/v1/settings/model"
  );
  return data.data;
}

export async function updateModelConfig(
  config: Partial<ModelConfig>
): Promise<ModelConfig> {
  const { data } = await api.patch<ApiResponse<ModelConfig>>(
    "/api/v1/settings/model",
    config
  );
  return data.data;
}

export interface PreparationStatus {
  step: string;
  progress: number;
  rejectedCount?: number;
}

/** Kick off the async workspace preparation pipeline (returns 202) */
export async function prepareWorkspace(workspaceId: string): Promise<void> {
  await api.post(`/api/v1/workspaces/${workspaceId}/prepare`);
}

/** Poll current preparation progress */
export async function fetchPreparationStatus(
  workspaceId: string
): Promise<PreparationStatus> {
  const { data } = await api.get<ApiResponse<PreparationStatus>>(
    `/api/v1/workspaces/${workspaceId}/preparation-status`
  );
  return data.data;
}

/** Fire-and-forget: pre-build agent context so it's cached when the voice session starts */
export function prefetchWorkspaceContext(workspaceId: string): void {
  api.post(`/api/v1/workspaces/${workspaceId}/context/warm`).catch(() => {
    // Best-effort — don't surface errors to the user
  });
}
