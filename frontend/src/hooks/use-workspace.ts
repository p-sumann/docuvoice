"use client";

import { useEffect, useRef } from "react";

import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  fetchWorkspaces,
  fetchWorkspace,
  fetchDocuments,
  fetchFindings,
  fetchExtractedFields,
  prefetchWorkspaceContext,
} from "@/lib/api";

/** How long cached data is considered fresh (2 minutes). */
const CACHE_TTL_MS = 120_000;

function isFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < CACHE_TTL_MS;
}

/** In-flight dedup: only one fetch per workspace at a time. */
let inflightWorkspaceId: string | null = null;

export function useWorkspaces() {
  const { workspaces, workspacesFetchedAt, isLoading, setWorkspaces, setLoading } =
    useWorkspaceStore();

  useEffect(() => {
    if (workspaces.length > 0 && isFresh(workspacesFetchedAt)) return;
    setLoading(true);
    fetchWorkspaces()
      .then(setWorkspaces)
      .finally(() => setLoading(false));
  }, [workspaces.length, workspacesFetchedAt, setWorkspaces, setLoading]);

  return { workspaces, isLoading };
}

export function useWorkspace(workspaceId: string) {
  const {
    activeWorkspace,
    activeWorkspaceId,
    activeWorkspaceFetchedAt,
    documents,
    documentsFetchedAt,
    findings,
    findingsFetchedAt,
    extractedFields,
    fieldsFetchedAt,
    isLoading,
    setWorkspaceData,
    setLoading,
  } = useWorkspaceStore();

  // Track whether this effect instance is still current
  const currentIdRef = useRef(workspaceId);
  currentIdRef.current = workspaceId;

  useEffect(() => {
    const isSameWorkspace = activeWorkspaceId === workspaceId;
    const isReady =
      activeWorkspace?.status === "active" ||
      activeWorkspace?.status === "ready";

    // Skip if same workspace, ready, and all resources are still fresh
    if (
      isSameWorkspace &&
      isReady &&
      isFresh(activeWorkspaceFetchedAt) &&
      isFresh(documentsFetchedAt) &&
      isFresh(findingsFetchedAt) &&
      isFresh(fieldsFetchedAt)
    ) {
      return;
    }

    // Dedup: skip if another instance is already fetching this workspace
    if (inflightWorkspaceId === workspaceId) return;
    inflightWorkspaceId = workspaceId;

    setLoading(true);

    // Pre-warm agent context cache (fire-and-forget)
    prefetchWorkspaceContext(workspaceId);

    Promise.all([
      fetchWorkspace(workspaceId),
      fetchDocuments(workspaceId),
      fetchFindings(workspaceId),
      fetchExtractedFields(workspaceId),
    ])
      .then(([workspace, docs, finds, fields]) => {
        // Only apply if this is still the workspace we care about
        if (currentIdRef.current === workspaceId) {
          setWorkspaceData({
            workspace,
            documents: docs,
            findings: finds,
            extractedFields: fields,
          });
        }
      })
      .finally(() => {
        if (inflightWorkspaceId === workspaceId) {
          inflightWorkspaceId = null;
        }
        if (currentIdRef.current === workspaceId) {
          setLoading(false);
        }
      });
  }, [
    workspaceId,
    activeWorkspaceId,
    activeWorkspace?.status,
    activeWorkspaceFetchedAt,
    documentsFetchedAt,
    findingsFetchedAt,
    fieldsFetchedAt,
    setWorkspaceData,
    setLoading,
  ]);

  return {
    workspace: activeWorkspaceId === workspaceId ? activeWorkspace : null,
    documents: activeWorkspaceId === workspaceId ? documents : [],
    findings: activeWorkspaceId === workspaceId ? findings : [],
    extractedFields: activeWorkspaceId === workspaceId ? extractedFields : [],
    isLoading,
  };
}
