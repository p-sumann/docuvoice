"use client";

import { useEffect, useRef, useState } from "react";

import { useWorkspaceStore } from "@/stores/workspace-store";
import { fetchRecentSessions } from "@/lib/api";
import type { Session } from "@/types/workspace";

/** Cache TTL for dashboard data (2 minutes). */
const CACHE_TTL_MS = 120_000;

let sessionsCache: { data: Session[]; fetchedAt: number } | null = null;

function isFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < CACHE_TTL_MS;
}

/**
 * Derive stats from the workspaces already in the store.
 * No extra API call needed — useWorkspaces() on the dashboard page already fetches the list.
 */
export function useDashboardStats() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  return {
    totalWorkspaces: workspaces.length,
    totalSessions: workspaces.reduce((sum, ws) => sum + ws.sessionCount, 0),
    totalMinutesUsed: workspaces.reduce((sum, ws) => sum + ws.minutesUsed, 0),
  };
}

export function useRecentSessions(limit: number = 3) {
  const [sessions, setSessions] = useState<Session[]>(sessionsCache?.data ?? []);
  const [isLoading, setIsLoading] = useState(!sessionsCache);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (sessionsCache && isFresh(sessionsCache.fetchedAt)) {
      setSessions(sessionsCache.data);
      setIsLoading(false);
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    setIsLoading(true);
    fetchRecentSessions(limit)
      .then((data) => {
        sessionsCache = { data, fetchedAt: Date.now() };
        setSessions(data);
      })
      .finally(() => {
        setIsLoading(false);
        fetchedRef.current = false;
      });
  }, [limit]);

  return { sessions, isLoading };
}

/** Invalidate dashboard caches (e.g. after creating/deleting workspaces). */
export function invalidateDashboardCache() {
  sessionsCache = null;
}
