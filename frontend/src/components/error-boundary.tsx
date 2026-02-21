"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center p-8">
          <Alert
            variant="destructive"
            className="max-w-md bg-[var(--dv-bg-surface)] border-red-500/20"
          >
            <AlertCircle className="size-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2 text-xs">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </AlertDescription>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              <RefreshCw className="size-3 mr-1" />
              Try Again
            </Button>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
