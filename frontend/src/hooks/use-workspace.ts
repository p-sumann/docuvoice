"use client";

import { useEffect } from "react";

import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  fetchWorkspaces,
  fetchWorkspace,
  fetchDocuments,
  fetchFindings,
  fetchExtractedFields,
  prefetchWorkspaceContext,
} from "@/lib/api";

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
    // Skip fetch only if workspace is already loaded AND in ready state.
    // If workspace is still in "setup" status, refetch to get updated data
    // after preparation completes (findings, extracted fields, etc.).
    const isCached = activeWorkspace?.id === workspaceId;
    const isReady = activeWorkspace?.status === "active" || activeWorkspace?.status === "ready";
    if (isCached && isReady) return;

    setLoading(true);
    // Pre-warm agent context cache so it's ready when the voice session starts
    prefetchWorkspaceContext(workspaceId);

    Promise.all([
      fetchWorkspace(workspaceId),
      fetchDocuments(workspaceId),
      fetchFindings(workspaceId),
      fetchExtractedFields(workspaceId),
    ])
      .then(([workspace, docs, finds, fields]) => {
        setActiveWorkspace(workspace);
        setDocuments(docs);
        setFindings(finds);
        setExtractedFields(fields);
      })
      .finally(() => setLoading(false));
  }, [
    workspaceId,
    activeWorkspace?.id,
    activeWorkspace?.status,
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
