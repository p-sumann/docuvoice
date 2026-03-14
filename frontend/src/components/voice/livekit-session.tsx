"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSession } from "@livekit/components-react";
import { ConnectionState, TokenSource } from "livekit-client";
import { AgentSessionProvider } from "@/components/agents-ui/agent-session-provider";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LiveKitSessionProps {
  workspaceId: string;
  participantName?: string;
  /** If true, session auto-starts on mount. Otherwise user must click mic. */
  autoStart?: boolean;
  onConnectionError?: (error: string) => void;
  children: ReactNode;
}

interface CachedToken {
  promise: Promise<{ serverUrl: string; participantToken: string }>;
  timestamp: number;
}

const TOKEN_CACHE_TTL = 5_000;
const DISCONNECT_GRACE_MS = 3_000;

export function LiveKitSession({
  workspaceId,
  participantName = "user",
  autoStart = false,
  onConnectionError,
  children,
}: LiveKitSessionProps) {
  const tokenSource = useMemo(() => {
    let cached: CachedToken | null = null;

    return TokenSource.custom(async (options) => {
      const now = Date.now();

      if (cached && now - cached.timestamp < TOKEN_CACHE_TTL) {
        return cached.promise;
      }

      const promise = fetch(`${API_URL}/api/v1/livekit/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          participantName: options.participantName ?? participantName,
          roomName: options.roomName ?? workspaceId,
        }),
      })
        .then(async (resp) => {
          if (!resp.ok) throw new Error(`Token request failed: ${resp.status}`);
          const data = await resp.json();
          return {
            serverUrl: data.data.serverUrl,
            participantToken: data.data.token,
          };
        })
        .catch((err) => {
          cached = null;
          throw err;
        });

      cached = { promise, timestamp: now };
      return promise;
    });
  }, [workspaceId, participantName]);

  const session = useSession(tokenSource, {
    agentName: "docuvoice-agent",
    roomName: workspaceId,
    participantName,
  });

  // Strict Mode guard — only auto-start once
  const [hasConnected, setHasConnected] = useState(false);

  const startSession = useCallback(() => {
    if (session.isConnected) return;
    session
      .start({
        tracks: {
          microphone: {
            enabled: true,
            publishOptions: { preConnectBuffer: true },
          },
        },
      })
      .catch((err: Error) => {
        onConnectionError?.(err.message || "Failed to connect");
      });
    setHasConnected(true);
  }, [session, onConnectionError]);

  useEffect(() => {
    if (autoStart && !hasConnected) {
      startSession();
    }
  }, [autoStart, hasConnected, startSession]);

  // Track disconnects after a real connection was established
  const wasFullyConnectedRef = useRef(false);
  const connectionStateRef = useRef(session.connectionState);
  connectionStateRef.current = session.connectionState;

  useEffect(() => {
    if (session.connectionState === ConnectionState.Connected) {
      wasFullyConnectedRef.current = true;
    }

    if (
      wasFullyConnectedRef.current &&
      session.connectionState === ConnectionState.Disconnected
    ) {
      const timer = setTimeout(() => {
        if (connectionStateRef.current === ConnectionState.Disconnected) {
          onConnectionError?.("Connection to workspace was lost");
        }
      }, DISCONNECT_GRACE_MS);
      return () => clearTimeout(timer);
    }
  }, [session.connectionState, onConnectionError]);

  return (
    <AgentSessionProvider session={session}>{children}</AgentSessionProvider>
  );
}
