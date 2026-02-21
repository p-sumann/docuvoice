"use client";

import { useEffect } from "react";

import { useWorkspaceStore } from "@/stores/workspace-store";
import { fetchWorkspaces, fetchWorkspace, fetchDocuments, fetchFindings } from "@/lib/api";
import { MOCK_EXTRACTED_FIELDS } from "@/lib/mock-data";

export function useWorkspaces() {
  const { workspaces, isLoading, setWorkspaces, setLoading } =
    useWorkspaceStore();

  useEffect(() => {
    if (workspaces.length > 0) return;
    setLoading(true);
    fetchWorkspaces()
      .then(setWorkspaces)
      .finally(() => setLoading(false));
  }, [workspaces.length, setWorkspaces, setLoading]);

  return { workspaces, isLoading };
}

export function useWorkspace(workspaceId: string) {
  const {
    activeWorkspace,
    documents,
    findings,
    extractedFields,
    isLoading,
    setActiveWorkspace,
    setDocuments,
    setFindings,
    setExtractedFields,
    setLoading,
  } = useWorkspaceStore();

  useEffect(() => {
    if (activeWorkspace?.id === workspaceId) return;
    setLoading(true);
    Promise.all([
      fetchWorkspace(workspaceId),
      fetchDocuments(workspaceId),
      fetchFindings(workspaceId),
    ])
      .then(([workspace, docs, finds]) => {
        setActiveWorkspace(workspace);
        setDocuments(docs);
        setFindings(finds);
        setExtractedFields(MOCK_EXTRACTED_FIELDS);
      })
      .finally(() => setLoading(false));
  }, [
    workspaceId,
    activeWorkspace?.id,
    setActiveWorkspace,
    setDocuments,
    setFindings,
    setExtractedFields,
    setLoading,
  ]);

  return {
    workspace: activeWorkspace,
    documents,
    findings,
    extractedFields,
    isLoading,
  };
}
