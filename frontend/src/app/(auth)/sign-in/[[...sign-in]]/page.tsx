import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Placeholder sign-in page — replace with <SignIn /> from @clerk/nextjs when real keys are configured
export default function SignInPage() {
  return (
    <Card className="w-full max-w-sm bg-[var(--dv-bg-elevated)] border-[var(--dv-border-default)]">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Sign in to DocuVoice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-[var(--dv-text-secondary)]">Email</Label>
          <Input
            type="email"
            placeholder="you@example.com"
            className="bg-[var(--dv-bg-base)] border-[var(--dv-border-default)]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-[var(--dv-text-secondary)]">Password</Label>
          <Input
            type="password"
            placeholder="••••••••"
            className="bg-[var(--dv-bg-base)] border-[var(--dv-border-default)]"
          />
        </div>
        <Button asChild className="w-full bg-[var(--dv-wine)] hover:bg-[var(--dv-wine)]/90 text-white">
          <Link href="/dashboard">Sign In</Link>
        </Button>
        <p className="text-xs text-center text-[var(--dv-text-muted)]">
          No account?{" "}
          <Link href="/sign-up" className="text-[var(--dv-wine)] hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
