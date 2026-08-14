/**
 * A2UI render contracts — Help Assembly / ESA
 * Server returns { component, data }; client maps to React cards.
 * Not a general dashboard; cards are observation surfaces only.
 */

export type JobStatus =
  | "pending"
  | "assigned"
  | "completed"
  | "cancelled"
  | "scheduled"
  | "quoted";

export interface JobCardData {
  id: string;
  status: JobStatus | string;
  imageUrl?: string | null;
  assigned?: string | null;
  quote?: number | null;
  createdAt?: string | null;
  service?: string | null;
  item?: string | null;
  address?: string | null;
}

export interface InventoryCardData {
  sku?: string | null;
  name: string;
  confidence?: number | null;
  vendor?: string | null;
  qty?: number | null;
  imageUrl?: string | null;
  agent?: "IRIS" | "FORGE" | "NEXUS" | "AVA" | string;
  status?: string | null;
}

export interface CaptureCTAData {
  label?: string;
  href?: string;
  hint?: string;
}

export type A2UIComponentName = "JobCard" | "InventoryCard" | "CaptureCTA" | "Stack";

export interface A2UINode {
  component: A2UIComponentName | string;
  data?: Record<string, unknown> | JobCardData | InventoryCardData | CaptureCTAData;
  children?: A2UINode[];
}

export interface IngestResult {
  ok: boolean;
  jobId?: string;
  imageUrl?: string;
  a2ui?: A2UINode;
  error?: string;
}
