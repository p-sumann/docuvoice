import type { DomainType } from "./workspace";

export interface DomainPlugin {
  id: DomainType;
  name: string;
  description: string;
  icon: string;
  documentTypes: string[];
  fieldCount: number;
  isAvailable: boolean;
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

export interface WorkspaceCreatePayload {
  name: string;
  domain: DomainType;
  documents: File[];
  plugins: string[];
}
