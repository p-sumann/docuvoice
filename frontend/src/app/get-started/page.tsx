"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AudioWaveform } from "lucide-react";

import { fetchWorkspaces } from "@/lib/api";

export default function GetStartedPage() {
  const router = useRouter();

  useEffect(() => {
    fetchWorkspaces()
      .then((workspaces) => {
        if (workspaces.length > 0) {
          router.replace("/dashboard");
        } else {
          router.replace("/onboarding");
        }
      })
      .catch(() => {
        router.replace("/onboarding");
      });
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--dv-bg-base)]">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="flex items-center justify-center size-16 rounded-2xl bg-[var(--dv-wine)]">
          <AudioWaveform className="size-8 text-white" />
        </div>
        <p className="text-sm text-[var(--dv-text-muted)]">Loading...</p>
      </div>
    </div>
  );
}
