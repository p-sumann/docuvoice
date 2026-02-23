"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function GlobalSettingsPage() {
  return (
    <div className="page-enter p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[var(--dv-text-primary)]">
        Settings
      </h1>

      {/* Theme */}
      <Card className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]">
        <CardHeader>
          <CardTitle className="text-sm">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs text-[var(--dv-text-secondary)]">
            Theme
          </Label>
          <div className="flex items-center gap-2">
            <Badge variant="default">Dark</Badge>
            <Badge variant="outline" className="opacity-50">
              Light (coming soon)
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-[var(--dv-border-subtle)]" />

      {/* Notifications */}
      <Card className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-subtle)]">
        <CardHeader>
          <CardTitle className="text-sm">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Email notifications", "In-app notifications"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between py-1"
            >
              <span className="text-sm text-[var(--dv-text-primary)]">
                {label}
              </span>
              <Badge variant="outline" className="text-[10px]">
                Enabled
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
