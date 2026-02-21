"use client";

import { useEffect, useState } from "react";

import { fetchSessions } from "@/lib/api";
import type { Session, SessionChannel } from "@/types/workspace";

export function useSessionHistory(workspaceId: string) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<SessionChannel | "all">("all");

  useEffect(() => {
    setIsLoading(true);
    fetchSessions(workspaceId)
      .then(setSessions)
      .finally(() => setIsLoading(false));
  }, [workspaceId]);

  const filteredSessions =
    filter === "all"
      ? sessions
      : sessions.filter((s) => s.channel === filter);

  return {
    sessions: filteredSessions,
    allSessions: sessions,
    isLoading,
    filter,
    setFilter,
  };
}
