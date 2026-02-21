import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Placeholder sign-up page — replace with <SignUp /> from @clerk/nextjs when real keys are configured
export default function SignUpPage() {
  return (
    <Card className="w-full max-w-sm bg-[var(--dv-bg-elevated)] border-[var(--dv-border-default)]">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Create your account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-[var(--dv-text-secondary)]">Name</Label>
          <Input
            placeholder="Your name"
            className="bg-[var(--dv-bg-base)] border-[var(--dv-border-default)]"
          />
        </div>
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
          <Link href="/dashboard">Create Account</Link>
        </Button>
        <p className="text-xs text-center text-[var(--dv-text-muted)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-[var(--dv-wine)] hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
