"use client";

import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/hooks/use-workspace";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceSettingsPage() {
  const params = useParams<{ workspaceId: string }>();
  const { workspace, isLoading } = useWorkspace(params.workspaceId);

  if (isLoading || !workspace) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-[var(--dv-bg-surface)]" />
        <Skeleton className="h-[300px] bg-[var(--dv-bg-surface)]" />
      </div>
    );
  }

  const domainLabels: Record<string, string> = {
    insurance_claims: "Insurance Claims",
    legal_contracts: "Legal Contracts",
    financial_dd: "Financial Due Diligence",
    custom: "Custom",
  };

  return (
    <div className="page-enter p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[var(--dv-text-primary)]">
        Workspace Settings
      </h1>

      <Tabs defaultValue="general">
        <TabsList className="bg-[var(--dv-bg-surface)] border border-[var(--dv-border-subtle)]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="plugins">Plugins</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]">
            <CardHeader>
              <CardTitle className="text-sm">General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-[var(--dv-text-secondary)]">
                  Workspace Name
                </Label>
                <Input
                  defaultValue={workspace.name}
                  className="bg-[var(--dv-bg-base)] border-[var(--dv-border-default)]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[var(--dv-text-secondary)]">
                  Domain Plugin
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={domainLabels[workspace.domain]}
                    readOnly
                    className="bg-[var(--dv-bg-base)] border-[var(--dv-border-default)] opacity-60"
                  />
                </div>
              </div>
              {workspace.phoneNumber && (
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--dv-text-secondary)]">
                    Phone Number
                  </Label>
                  <Input
                    value={workspace.phoneNumber}
                    readOnly
                    className="bg-[var(--dv-bg-base)] border-[var(--dv-border-default)] opacity-60 font-mono"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Separator className="bg-[var(--dv-border-subtle)]" />

          <Card className="bg-[var(--dv-bg-surface)] border-red-500/20">
            <CardHeader>
              <CardTitle className="text-sm text-red-400">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => toast.error("Delete not implemented in demo")}
              >
                Delete Workspace
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="mt-6">
          <Card className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]">
            <CardHeader>
              <CardTitle className="text-sm">Voice Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-[var(--dv-text-secondary)]">
                  Voice
                </Label>
                <div className="flex gap-2">
                  {["Tiffany", "Matthew", "Amy"].map((voice) => (
                    <Badge
                      key={voice}
                      variant={voice === "Tiffany" ? "default" : "outline"}
                      className="cursor-pointer"
                    >
                      {voice}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[var(--dv-text-secondary)]">
                  Turn Detection
                </Label>
                <div className="flex gap-2">
                  {["Low", "Medium", "High"].map((level) => (
                    <Badge
                      key={level}
                      variant={level === "Medium" ? "default" : "outline"}
                      className="cursor-pointer"
                    >
                      {level}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[var(--dv-text-secondary)]">
                  Greeting Message
                </Label>
                <Input
                  defaultValue="Hello! I'm your DocuVoice assistant. How can I help?"
                  className="bg-[var(--dv-bg-base)] border-[var(--dv-border-default)]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plugins" className="mt-6">
          <Card className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]">
            <CardHeader>
              <CardTitle className="text-sm">Plugin Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-8">
                <p className="text-sm text-[var(--dv-text-muted)]">
                  Plugin connections coming soon
                </p>
                <p className="text-xs text-[var(--dv-text-muted)] mt-1">
                  Connect to Slack, Jira, and more
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]">
            <CardHeader>
              <CardTitle className="text-sm">Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-8">
                <p className="text-sm text-[var(--dv-text-muted)]">
                  Team management coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
