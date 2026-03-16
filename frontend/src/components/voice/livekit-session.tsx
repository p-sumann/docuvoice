"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "@livekit/components-react";
import { ConnectionState, TokenSource } from "livekit-client";
import { AgentSessionProvider } from "@/components/agents-ui/agent-session-provider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function dispatchAgent(workspaceId: string, workspaceName?: string, domain?: string): Promise<void> {
  await fetch(`${API_URL}/api/v1/livekit/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, workspaceName: workspaceName ?? "", domain: domain ?? "insurance_claims" }),
  });
}

export interface TranscriptMessage {
  id: string;
  role: "agent" | "user";
  text: string;
  timestamp: number;
}

export interface PostSessionData {
  duration: number; // seconds
  endedAt: string;
  transcript: TranscriptMessage[];
}

export type SessionPhase = "idle" | "connecting" | "connected" | "ended";

interface LiveKitSessionContextValue {
  startSession: () => void;
  dismissPostSession: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  connectionState: ConnectionState | null;
  phase: SessionPhase;
  postSessionData: PostSessionData | null;
  /** Ref that child components update with live transcript data. Read at session end. */
  transcriptRef: React.MutableRefObject<TranscriptMessage[]>;
}

const noopRef = { current: [] as TranscriptMessage[] };

const LiveKitSessionContext = createContext<LiveKitSessionContextValue>({
  startSession: () => {},
  dismissPostSession: () => {},
  isConnected: false,
  isConnecting: false,
  connectionState: null,
  phase: "idle",
  postSessionData: null,
  transcriptRef: noopRef,
});

export function useLiveKitSessionActions(): LiveKitSessionContextValue {
  return useContext(LiveKitSessionContext);
}

interface LiveKitSessionProps {
  workspaceId: string;
  workspaceName?: string;
  domain?: string;
  participantName?: string;
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
  workspaceName,
  domain,
  participantName = "user",
  onConnectionError,
  children,
}: LiveKitSessionProps) {
  const [started, setStarted] = useState(false);
  const [postSessionData, setPostSessionData] = useState<PostSessionData | null>(null);
  const sessionStartedAtRef = useRef<number>(0);
  const transcriptRef = useRef<TranscriptMessage[]>([]);

  const startSession = useCallback(() => {
    setPostSessionData(null);
    transcriptRef.current = [];
    sessionStartedAtRef.current = Date.now();
    setStarted(true);
  }, []);

  const dismissPostSession = useCallback(() => {
    setPostSessionData(null);
  }, []);

  const handleStopped = useCallback(() => {
    const duration = Math.round((Date.now() - sessionStartedAtRef.current) / 1000);
    setPostSessionData({
      duration,
      endedAt: new Date().toISOString(),
      transcript: [...transcriptRef.current],
    });
    setStarted(false);
  }, []);

  useEffect(() => {
    setStarted(false);
    setPostSessionData(null);
  }, [workspaceId]);

  const phase: SessionPhase = started ? "connected" : postSessionData ? "ended" : "idle";

  if (!started) {
    return (
      <LiveKitSessionContext.Provider
        value={{
          startSession,
          dismissPostSession,
          isConnected: false,
          isConnecting: false,
          connectionState: null,
          phase,
          postSessionData,
          transcriptRef,
        }}
      >
        {children}
      </LiveKitSessionContext.Provider>
    );
  }

  return (
    <LiveKitSessionInner
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      domain={domain}
      participantName={participantName}
      onConnectionError={onConnectionError}
      onStopped={handleStopped}
      transcriptRef={transcriptRef}
    >
      {children}
    </LiveKitSessionInner>
  );
}

function LiveKitSessionInner({
  workspaceId,
  workspaceName,
  domain,
  participantName = "user",
  onConnectionError,
  onStopped,
  transcriptRef,
  children,
}: LiveKitSessionProps & { onStopped: () => void; transcriptRef: React.MutableRefObject<TranscriptMessage[]> }) {
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
          workspaceName: workspaceName ?? "",
          domain: domain ?? "insurance_claims",
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

  const didStartRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);

  useEffect(() => {
    if (didStartRef.current) return;
    didStartRef.current = true;
    intentionalDisconnectRef.current = false;

    session
      .start({
        tracks: {
          microphone: {
            enabled: true,
            publishOptions: { preConnectBuffer: true },
          },
        },
      })
      .then(() => dispatchAgent(workspaceId, workspaceName, domain))
      .catch((err: Error) => {
        onConnectionError?.(err.message || "Failed to connect");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      wasFullyConnectedRef.current = false;

      if (intentionalDisconnectRef.current) {
        onStopped();
      } else {
        const timer = setTimeout(() => {
          if (connectionStateRef.current === ConnectionState.Disconnected) {
            onConnectionError?.("Connection to workspace was lost");
            onStopped();
          }
        }, DISCONNECT_GRACE_MS);
        return () => clearTimeout(timer);
      }
    }
  }, [session.connectionState, onConnectionError, onStopped]);

  const sessionWithTrackedEnd = useMemo(() => {
    const originalEnd = session.end.bind(session);
    return {
      ...session,
      end: () => {
        intentionalDisconnectRef.current = true;
        return originalEnd();
      },
    };
  }, [session]);

  const hasEverConnected = wasFullyConnectedRef.current || session.isConnected;
  const isEffectivelyConnecting =
    session.connectionState === ConnectionState.Connecting ||
    (session.connectionState === ConnectionState.Disconnected && !hasEverConnected);

  const contextValue = useMemo<LiveKitSessionContextValue>(
    () => ({
      startSession: () => {},
      dismissPostSession: () => {},
      isConnected: session.isConnected,
      isConnecting: isEffectivelyConnecting,
      connectionState: session.connectionState,
      phase: isEffectivelyConnecting ? "connecting" : "connected",
      postSessionData: null,
      transcriptRef,
    }),
    [session.isConnected, session.connectionState, isEffectivelyConnecting, transcriptRef],
  );

  return (
    <LiveKitSessionContext.Provider value={contextValue}>
      <AgentSessionProvider session={sessionWithTrackedEnd}>
        {children}
      </AgentSessionProvider>
    </LiveKitSessionContext.Provider>
  );
}
