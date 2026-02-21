"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TemplateSelectorGrid } from "@/components/workspace/template-selector";
import { DocumentUpload } from "@/components/documents/document-upload";
import { DocumentList } from "@/components/documents/document-list";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DOMAIN_PLUGINS } from "@/lib/constants";
import { useDocuments } from "@/hooks/use-documents";
import type { WorkspaceCreatePayload } from "@/types/plugin";
import type { DomainType } from "@/types/workspace";

interface WorkspaceWizardProps {
  onComplete: (payload: WorkspaceCreatePayload) => void;
  onCancel: () => void;
  className?: string;
}

const steps = [
  { id: 1, title: "Choose Domain", description: "Select your use case" },
  { id: 2, title: "Upload Documents", description: "Add files to analyze" },
  { id: 3, title: "Configure", description: "Optional plugins" },
  { id: 4, title: "Review", description: "Activate workspace" },
];

export function WorkspaceWizard({
  onComplete,
  onCancel,
  className,
}: WorkspaceWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<DomainType | null>(null);
  const { documents } = useDocuments();

  const canNext = () => {
    switch (currentStep) {
      case 1:
        return selectedDomain !== null && workspaceName.trim().length > 0;
      case 2:
        return documents.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete({
        name: workspaceName,
        domain: selectedDomain!,
        documents: [],
        plugins: [],
      });
    }
  };

  const selectedPlugin = DOMAIN_PLUGINS.find((p) => p.id === selectedDomain);

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-0">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all",
                  currentStep > step.id &&
                    "bg-[var(--dv-green)] text-white",
                  currentStep === step.id &&
                    "bg-[var(--dv-wine)] text-white",
                  currentStep < step.id &&
                    "bg-[var(--dv-bg-active)] text-[var(--dv-text-muted)]"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="size-4" />
                ) : (
                  step.id
                )}
              </div>
              <span className="text-[10px] text-[var(--dv-text-muted)] mt-1 whitespace-nowrap">
                {step.title}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-2 mb-4",
                  currentStep > step.id
                    ? "bg-[var(--dv-green)]"
                    : "bg-[var(--dv-border-default)]"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[300px]">
        {currentStep === 1 && (
          <div className="space-y-6 fade-in">
            <div className="space-y-2">
              <Label htmlFor="workspace-name" className="text-sm text-[var(--dv-text-secondary)]">
                Workspace Name
              </Label>
              <Input
                id="workspace-name"
                placeholder="e.g., Insurance Claims — AUT-2024-789"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-default)] text-[var(--dv-text-primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-[var(--dv-text-secondary)]">
                Domain Template
              </Label>
              <TemplateSelectorGrid
                templates={DOMAIN_PLUGINS}
                selectedTemplate={selectedDomain}
                onSelect={setSelectedDomain}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 fade-in">
            <DocumentUpload workspaceId="ws-new" />
            {documents.length > 0 && (
              <DocumentList documents={documents} />
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex flex-col items-center justify-center py-12 fade-in">
            <div className="w-12 h-12 rounded-full bg-[var(--dv-bg-active)] flex items-center justify-center mb-4">
              <Settings2Icon className="size-6 text-[var(--dv-text-muted)]" />
            </div>
            <p className="text-sm text-[var(--dv-text-secondary)]">
              Plugin configuration coming soon
            </p>
            <p className="text-xs text-[var(--dv-text-muted)] mt-1">
              You can configure integrations after workspace creation
            </p>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4 fade-in">
            <Card className="bg-[var(--dv-bg-surface)] border-[var(--dv-border-default)]">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-[var(--dv-text-primary)]">
                  {workspaceName}
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--dv-text-muted)]">Domain</span>
                    <p className="text-[var(--dv-text-primary)] font-medium">
                      {selectedPlugin?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--dv-text-muted)]">Documents</span>
                    <p className="text-[var(--dv-text-primary)] font-medium">
                      {documents.length} files
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--dv-text-muted)]">Plugins</span>
                    <p className="text-[var(--dv-text-muted)]">None configured</p>
                  </div>
                  <div>
                    <span className="text-[var(--dv-text-muted)]">Phone Number</span>
                    <Badge variant="outline" className="text-[10px]">
                      Auto-assigned
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--dv-border-subtle)]">
        <Button
          variant="ghost"
          onClick={currentStep === 1 ? onCancel : () => setCurrentStep((s) => s - 1)}
          className="text-[var(--dv-text-secondary)]"
        >
          <ChevronLeft className="size-4 mr-1" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canNext()}
          className="bg-[var(--dv-wine)] hover:bg-[var(--dv-wine)]/90 text-white"
        >
          {currentStep === 4 ? (
            <>
              <Rocket className="size-4 mr-1" />
              Activate Workspace
            </>
          ) : (
            <>
              Next
              <ChevronRight className="size-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Inline icon to avoid adding another import for a simple placeholder
function Settings2Icon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  );
}
