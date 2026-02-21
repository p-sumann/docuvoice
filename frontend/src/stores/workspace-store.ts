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
  activeWorkspace: Workspace | null;
  documents: Document[];
  sessions: Session[];
  findings: Finding[];
  extractedFields: ExtractedField[];
  isLoading: boolean;

  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocumentStatus: (docId: string, status: DocumentStatus) => void;
  setReferenced: (docId: string, isReferenced: boolean) => void;
  setSessions: (sessions: Session[]) => void;
  setFindings: (findings: Finding[]) => void;
  addFinding: (finding: Finding) => void;
  setExtractedFields: (fields: ExtractedField[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  activeWorkspace: null,
  documents: [],
  sessions: [],
  findings: [],
  extractedFields: [],
  isLoading: false,

  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
  setDocuments: (documents) => set({ documents }),
  addDocument: (document) =>
    set((state) => ({ documents: [...state.documents, document] })),
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
  setFindings: (findings) => set({ findings }),
  addFinding: (finding) =>
    set((state) => ({ findings: [...state.findings, finding] })),
  setExtractedFields: (extractedFields) => set({ extractedFields }),
  setLoading: (isLoading) => set({ isLoading }),
}));
