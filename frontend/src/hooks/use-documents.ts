"use client";

import { useCallback } from "react";

import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Document, DocumentStatus } from "@/types/workspace";

export function useDocuments() {
  const { documents, addDocument, updateDocumentStatus, setReferenced } =
    useWorkspaceStore();

  const simulateUpload = useCallback(
    (file: File, workspaceId: string) => {
      const docId = `doc-${Date.now()}`;
      const newDoc: Document = {
        id: docId,
        workspaceId,
        filename: file.name,
        documentType: "custom",
        status: "uploading",
        s3Key: `${workspaceId}/documents/${file.name}`,
        sizeBytes: file.size,
        sizeTokens: 0,
        extractedFields: [],
        processingError: null,
        isReferenced: false,
        createdAt: new Date().toISOString(),
      };

      addDocument(newDoc);

      // Simulate upload -> processing -> ready
      setTimeout(() => updateDocumentStatus(docId, "processing"), 2000);
      setTimeout(() => {
        updateDocumentStatus(docId, "ready");
      }, 5000);

      return docId;
    },
    [addDocument, updateDocumentStatus]
  );

  const setDocumentReferenced = useCallback(
    (docId: string, referenced: boolean) => {
      setReferenced(docId, referenced);
    },
    [setReferenced]
  );

  return {
    documents,
    simulateUpload,
    setDocumentReferenced,
  };
}
