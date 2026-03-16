import { create } from "zustand";

import type {
  Workspace,
  Document,
  Session,
  ExtractedField,
  DocumentStatus,
} from "@/types/workspace";
import type { Finding } from "@/types/finding";

interface WorkspaceStore {
  workspaces: Workspace[];
  workspacesFetchedAt: number;
  activeWorkspace: Workspace | null;
  /** Tracks which workspace ID the cached sub-resources belong to. */
  activeWorkspaceId: string | null;
  activeWorkspaceFetchedAt: number;
  documents: Document[];
  documentsFetchedAt: number;
  sessions: Session[];
  findings: Finding[];
  findingsFetchedAt: number;
  extractedFields: ExtractedField[];
  fieldsFetchedAt: number;
  isLoading: boolean;

  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (docId: string, document: Document) => void;
  updateDocumentStatus: (docId: string, status: DocumentStatus) => void;
  setReferenced: (docId: string, isReferenced: boolean) => void;
  setSessions: (sessions: Session[]) => void;
  setFindings: (findings: Finding[]) => void;
  addFinding: (finding: Finding) => void;
  setExtractedFields: (fields: ExtractedField[]) => void;
  setLoading: (loading: boolean) => void;
  /** Bulk-set all workspace data at once to avoid intermediate renders. */
  setWorkspaceData: (data: {
    workspace: Workspace | null;
    documents: Document[];
    findings: Finding[];
    extractedFields: ExtractedField[];
  }) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  workspacesFetchedAt: 0,
  activeWorkspace: null,
  activeWorkspaceId: null,
  activeWorkspaceFetchedAt: 0,
  documents: [],
  documentsFetchedAt: 0,
  sessions: [],
  findings: [],
  findingsFetchedAt: 0,
  extractedFields: [],
  fieldsFetchedAt: 0,
  isLoading: false,

  setWorkspaces: (workspaces) => set({ workspaces, workspacesFetchedAt: Date.now() }),
  setActiveWorkspace: (activeWorkspace) =>
    set({
      activeWorkspace,
      activeWorkspaceId: activeWorkspace?.id ?? null,
      activeWorkspaceFetchedAt: Date.now(),
    }),
  setDocuments: (documents) => set({ documents, documentsFetchedAt: Date.now() }),
  addDocument: (document) =>
    set((state) => ({ documents: [...state.documents, document] })),
  updateDocument: (docId, document) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === docId ? document : doc
      ),
    })),
  updateDocumentStatus: (docId, status) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === docId ? { ...doc, status } : doc
      ),
    })),
  setReferenced: (docId, isReferenced) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === docId ? { ...doc, isReferenced } : doc
      ),
    })),
  setSessions: (sessions) => set({ sessions }),
  setFindings: (findings) => set({ findings, findingsFetchedAt: Date.now() }),
  addFinding: (finding) =>
    set((state) => ({ findings: [...state.findings, finding] })),
  setExtractedFields: (extractedFields) => set({ extractedFields, fieldsFetchedAt: Date.now() }),
  setLoading: (isLoading) => set({ isLoading }),
  setWorkspaceData: ({ workspace, documents, findings, extractedFields }) => {
    const now = Date.now();
    set({
      activeWorkspace: workspace,
      activeWorkspaceId: workspace?.id ?? null,
      activeWorkspaceFetchedAt: now,
      documents,
      documentsFetchedAt: now,
      findings,
      findingsFetchedAt: now,
      extractedFields,
      fieldsFetchedAt: now,
    });
  },
}));
