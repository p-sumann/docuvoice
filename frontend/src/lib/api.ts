import type { Workspace, Document, Session, TranscriptEntry } from "@/types/workspace";
import type { Finding } from "@/types/finding";
import {
  MOCK_WORKSPACES,
  MOCK_DOCUMENTS,
  MOCK_SESSIONS,
  MOCK_TRANSCRIPT,
  MOCK_FINDINGS,
} from "@/lib/mock-data";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  return delay(200 + Math.random() * 300);
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  await randomDelay();
  return MOCK_WORKSPACES;
}

export async function fetchWorkspace(id: string): Promise<Workspace | null> {
  await randomDelay();
  return MOCK_WORKSPACES.find((w) => w.id === id) ?? null;
}

export async function fetchDocuments(workspaceId: string): Promise<Document[]> {
  await randomDelay();
  return MOCK_DOCUMENTS.filter((d) => d.workspaceId === workspaceId);
}

export async function fetchSessions(workspaceId: string): Promise<Session[]> {
  await randomDelay();
  return MOCK_SESSIONS.filter((s) => s.workspaceId === workspaceId);
}

export async function fetchFindings(workspaceId: string): Promise<Finding[]> {
  await randomDelay();
  return MOCK_FINDINGS.filter((f) => f.workspaceId === workspaceId);
}

export async function fetchTranscript(
  _sessionId: string
): Promise<TranscriptEntry[]> {
  await randomDelay();
  return MOCK_TRANSCRIPT;
}
