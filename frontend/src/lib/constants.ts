import type { DomainPlugin } from "@/types/plugin";

export interface NavItem {
  label: string;
  icon: string;
  href: string;
  isWorkspaceScoped: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    icon: "LayoutDashboard",
    href: "/",
    isWorkspaceScoped: false,
  },
  {
    label: "Documents",
    icon: "FileText",
    href: "/workspace/[workspaceId]",
    isWorkspaceScoped: true,
  },
  {
    label: "Voice Sessions",
    icon: "Mic",
    href: "/workspace/[workspaceId]/sessions",
    isWorkspaceScoped: true,
  },
  {
    label: "Findings",
    icon: "Search",
    href: "/workspace/[workspaceId]",
    isWorkspaceScoped: true,
  },
  {
    label: "Phone",
    icon: "Phone",
    href: "/workspace/[workspaceId]",
    isWorkspaceScoped: true,
  },
  {
    label: "Settings",
    icon: "Settings",
    href: "/workspace/[workspaceId]/settings",
    isWorkspaceScoped: true,
  },
];

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const ORB_SIZE = {
  default: 112,
  mobile: 96,
  hover: 118,
} as const;

export const PANEL_MIN_WIDTH = {
  sidebar: 48,
  center: 400,
  docPanel: 300,
} as const;

export const DOMAIN_PLUGINS: DomainPlugin[] = [
  {
    id: "insurance_claims",
    name: "Insurance Claims",
    description:
      "Analyze insurance claims, compare policy limits, detect discrepancies across FNOL, policies, and medical bills.",
    icon: "ClipboardCheck",
    documentTypes: [
      "First Notice of Loss",
      "Insurance Policy",
      "Medical Bills",
      "Police Report",
    ],
    fieldCount: 45,
    isAvailable: true,
  },
  {
    id: "legal_contracts",
    name: "Legal Contracts",
    description:
      "Review contracts, NDAs, and legal documents. Identify key clauses, obligations, and potential risks.",
    icon: "Scale",
    documentTypes: [
      "Contract",
      "NDA",
      "Amendment",
      "Terms of Service",
    ],
    fieldCount: 32,
    isAvailable: true,
  },
  {
    id: "financial_dd",
    name: "Financial Due Diligence",
    description:
      "Analyze financial statements, balance sheets, and audit reports for due diligence reviews.",
    icon: "TrendingUp",
    documentTypes: [
      "Balance Sheet",
      "Income Statement",
      "Audit Report",
      "Tax Return",
    ],
    fieldCount: 38,
    isAvailable: true,
  },
  {
    id: "custom",
    name: "Custom",
    description:
      "Define your own document types, extraction rules, and analysis workflows for any domain.",
    icon: "Wrench",
    documentTypes: ["Custom Document"],
    fieldCount: 0,
    isAvailable: true,
  },
];
