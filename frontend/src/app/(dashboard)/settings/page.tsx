"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fetchModelConfig, updateModelConfig } from "@/lib/api";
import type { ModelConfig, Tonality } from "@/types/settings";

const TABS = ["General", "Model", "Notifications"] as const;
type Tab = (typeof TABS)[number];

const TONALITIES: { value: Tonality; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "concise", label: "Concise" },
  { value: "detailed", label: "Detailed" },
];

export default function GlobalSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Model");

  return (
    <div className="page-enter h-full overflow-auto p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[var(--dv-text-primary)]">
        Settings
      </h1>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--dv-bg-surface)] border border-[var(--dv-border-subtle)] w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-[var(--dv-bg-active)] text-[var(--dv-text-primary)]"
                : "text-[var(--dv-text-muted)] hover:text-[var(--dv-text-secondary)]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "General" && <GeneralTab />}
      {activeTab === "Model" && <ModelTab />}
      {activeTab === "Notifications" && <NotificationsTab />}
    </div>
  );
}

function GeneralTab() {
  return (
    <Card className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]">
      <CardHeader>
        <CardTitle className="text-sm">Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label className="text-xs text-[var(--dv-text-secondary)]">Theme</Label>
        <div className="flex items-center gap-2">
          <Badge variant="default">Dark</Badge>
          <Badge variant="outline" className="opacity-50">
            Light (coming soon)
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ModelTab() {
  const [config, setConfig] = useState<ModelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchModelConfig()
      .then(setConfig)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await updateModelConfig(config);
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 bg-[var(--dv-bg-surface)]" />
        ))}
      </div>
    );
  }

  if (!config) {
    return (
      <p className="text-sm text-[var(--dv-text-muted)]">
        Failed to load model configuration.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Persona */}
      <Card className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]">
        <CardHeader>
          <CardTitle className="text-sm">Persona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="persona" className="text-xs text-[var(--dv-text-secondary)]">
              Assistant Name
            </Label>
            <Input
              id="persona"
              value={config.persona}
              onChange={(e) => setConfig({ ...config, persona: e.target.value })}
              placeholder="e.g., DocuVoice Assistant"
              className="bg-[var(--dv-bg-base)] border-[var(--dv-border-default)] text-[var(--dv-text-primary)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-prompt" className="text-xs text-[var(--dv-text-secondary)]">
              System Prompt
            </Label>
            <Textarea
              id="system-prompt"
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              placeholder="Custom instructions for the assistant..."
              rows={4}
              className="bg-[var(--dv-bg-base)] border-[var(--dv-border-default)] text-[var(--dv-text-primary)] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Generation */}
      <Card className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]">
        <CardHeader>
          <CardTitle className="text-sm">Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-[var(--dv-text-secondary)]">Temperature</Label>
              <span className="text-xs font-mono text-[var(--dv-text-primary)]">
                {config.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[config.temperature]}
              onValueChange={([v]) => setConfig({ ...config, temperature: v })}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[var(--dv-text-muted)]">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <Separator className="bg-[var(--dv-border-subtle)]" />

          {/* Tonality */}
          <div className="space-y-3">
            <Label className="text-xs text-[var(--dv-text-secondary)]">Tonality</Label>
            <div className="flex flex-wrap gap-2">
              {TONALITIES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setConfig({ ...config, tonality: t.value })}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                    config.tonality === t.value
                      ? "bg-[var(--dv-wine)] border-[var(--dv-wine)] text-white"
                      : "bg-transparent border-[var(--dv-border-default)] text-[var(--dv-text-secondary)] hover:border-[var(--dv-border-strong)]"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-[var(--dv-border-subtle)]" />

          {/* Max Tokens */}
          <div className="space-y-2">
            <Label htmlFor="max-tokens" className="text-xs text-[var(--dv-text-secondary)]">
              Max Tokens
            </Label>
            <Input
              id="max-tokens"
              type="number"
              value={config.maxTokens}
              onChange={(e) =>
                setConfig({ ...config, maxTokens: parseInt(e.target.value) || 0 })
              }
              min={256}
              max={32768}
              className="bg-[var(--dv-bg-base)] border-[var(--dv-border-default)] text-[var(--dv-text-primary)] w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[var(--dv-wine)] hover:bg-[var(--dv-wine)]/90 text-white"
        >
          {isSaving ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Save Changes
        </Button>
        {saved && (
          <span className="text-xs text-[var(--dv-green)] fade-in">
            Settings saved
          </span>
        )}
      </div>
    </div>
  );
}

function NotificationsTab() {
  return (
    <Card className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]">
      <CardHeader>
        <CardTitle className="text-sm">Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {["Email notifications", "In-app notifications"].map((label) => (
          <div key={label} className="flex items-center justify-between py-1">
            <span className="text-sm text-[var(--dv-text-primary)]">{label}</span>
            <Badge variant="outline" className="text-[10px]">
              Enabled
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
