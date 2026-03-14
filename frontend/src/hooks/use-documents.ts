"use client";

import { useCallback } from "react";

import { uploadDocument } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Document } from "@/types/workspace";

export function useDocuments() {
  const { documents, addDocument, updateDocument, updateDocumentStatus, setReferenced } =
    useWorkspaceStore();

  const upload = useCallback(
    async (file: File, workspaceId: string) => {
      // Optimistic local entry while the real upload runs
      const tempId = `doc-${Date.now()}`;
      const placeholder: Document = {
        id: tempId,
        workspaceId,
        filename: file.name,
        documentType: "auto",
        status: "uploading",
        s3Key: "",
        sizeBytes: file.size,
        sizeTokens: 0,
        extractedFields: [],
        processingError: null,
        rejectionReason: null,
        isReferenced: false,
        createdAt: new Date().toISOString(),
      };
      addDocument(placeholder);

      try {
        const doc = await uploadDocument(workspaceId, file);
        // Replace placeholder with real server response
        updateDocument(tempId, { ...doc, rejectionReason: doc.rejectionReason ?? null });
        return doc.id;
      } catch {
        updateDocumentStatus(tempId, "error");
        return tempId;
      }
    },
    [addDocument, updateDocument, updateDocumentStatus]
  );

  const setDocumentReferenced = useCallback(
    (docId: string, referenced: boolean) => {
      setReferenced(docId, referenced);
    },
    [setReferenced]
  );

  return {
    documents,
    upload,
    // Keep old name as alias for backward compat
    simulateUpload: upload,
    setDocumentReferenced,
  };
}
