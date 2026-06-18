// Domain knowledge for the accounting / audit / tax / legal practice.
// These playbooks drive the AI task-generation and the standard workflows.

import type { ServiceLine } from "@prisma/client";

export const SERVICE_LINES: {
  key: ServiceLine;
  label: string;
  group: "Accounting" | "Audit" | "Tax" | "Legal";
  description: string;
}[] = [
  { key: "BOOKKEEPING", label: "Bookkeeping", group: "Accounting", description: "Day-to-day recording of transactions and ledger maintenance." },
  { key: "ACCOUNTING", label: "Accounting & Financial Statements", group: "Accounting", description: "Period-end close and preparation of financial statements." },
  { key: "AUDIT", label: "Audit & Assurance", group: "Audit", description: "Statutory and internal audit engagements." },
  { key: "CORP_TAX_REGISTRATION", label: "Corporate Tax Registration", group: "Tax", description: "Register the entity for corporate tax with the authority." },
  { key: "CORP_TAX_FILING", label: "Corporate Tax Filing", group: "Tax", description: "Compute and submit the corporate tax return." },
  { key: "CORP_TAX_DEREGISTRATION", label: "Corporate Tax Deregistration", group: "Tax", description: "Cancel corporate tax registration on cessation." },
  { key: "VAT_REGISTRATION", label: "VAT Registration", group: "Tax", description: "Register the entity for VAT." },
  { key: "VAT_FILING", label: "VAT Return Filing", group: "Tax", description: "Prepare and file periodic VAT returns." },
  { key: "VAT_DEREGISTRATION", label: "VAT Deregistration", group: "Tax", description: "Cancel VAT registration." },
  { key: "LEGAL", label: "Legal & Corporate Services", group: "Legal", description: "Contracts, corporate structuring and legal compliance." },
];

export function serviceLabel(key: ServiceLine): string {
  return SERVICE_LINES.find((s) => s.key === key)?.label ?? key;
}

export function serviceGroup(key: ServiceLine): string {
  return SERVICE_LINES.find((s) => s.key === key)?.group ?? "Other";
}

// Standard checklists per service line. Used to scaffold an engagement and as
// the deterministic fallback when no AI key is configured.
export const PLAYBOOKS: Record<ServiceLine, string[]> = {
  BOOKKEEPING: [
    "Collect bank statements and source documents for the period",
    "Reconcile all bank and cash accounts",
    "Record sales and purchase invoices to the ledger",
    "Post accruals, prepayments and adjusting entries",
    "Review and clear suspense / unallocated items",
    "Produce trial balance and management report",
  ],
  ACCOUNTING: [
    "Confirm scope, period and reporting framework with client",
    "Perform period-end close and reconciliations",
    "Prepare draft financial statements",
    "Internal review of statements and disclosures",
    "Partner review and sign-off",
    "Issue financial statements to client",
  ],
  AUDIT: [
    "Engagement acceptance and independence checks",
    "Risk assessment and audit planning memo",
    "Test internal controls",
    "Substantive testing of material balances",
    "Obtain management representation letter",
    "Draft audit report and review with partner",
    "Issue signed audit opinion",
  ],
  CORP_TAX_REGISTRATION: [
    "Gather trade license, MOA and ownership details",
    "Determine registration eligibility and effective date",
    "Create / access the tax authority portal account",
    "Complete corporate tax registration application",
    "Submit application and track reference number",
    "File the issued Tax Registration Number (TRN)",
  ],
  CORP_TAX_FILING: [
    "Confirm tax period and financial data are finalised",
    "Compute taxable income and adjustments",
    "Apply reliefs, exemptions and small business relief if eligible",
    "Prepare the corporate tax return working papers",
    "Internal review of computation",
    "Submit corporate tax return on the portal",
    "Arrange tax payment and confirm receipt",
  ],
  CORP_TAX_DEREGISTRATION: [
    "Confirm cessation of business / trigger event",
    "Ensure all returns are filed and liabilities settled",
    "Prepare deregistration application",
    "Submit deregistration request to the authority",
    "Obtain confirmation of deregistration",
  ],
  VAT_REGISTRATION: [
    "Assess taxable turnover against registration threshold",
    "Collect supporting documents (license, bank, financials)",
    "Complete VAT registration application",
    "Submit application and monitor status",
    "Record issued TRN and effective registration date",
  ],
  VAT_FILING: [
    "Collect sales and purchase data for the tax period",
    "Reconcile output VAT and input VAT",
    "Validate against ledger and prior returns",
    "Prepare the VAT return working file",
    "Internal review of VAT return",
    "Submit VAT return on the portal",
    "Arrange payment / claim refund and confirm",
  ],
  VAT_DEREGISTRATION: [
    "Confirm grounds for deregistration",
    "File final VAT return and settle liabilities",
    "Prepare and submit deregistration application",
    "Obtain confirmation of VAT deregistration",
  ],
  LEGAL: [
    "Clarify legal scope and required deliverables",
    "Collect corporate documents and instructions",
    "Draft / review the relevant agreements or filings",
    "Internal legal review",
    "Finalise and execute documents",
    "File with relevant authority and archive",
  ],
};

export function defaultTasksFor(serviceLine: ServiceLine): string[] {
  return PLAYBOOKS[serviceLine] ?? [];
}

export const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  BLOCKED: "bg-red-100 text-red-700",
  REVIEW: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
  PLANNING: "bg-slate-100 text-slate-700",
  PENDING_CLIENT: "bg-amber-100 text-amber-700",
  FILED: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-slate-200 text-slate-500",
  UPCOMING: "bg-slate-100 text-slate-700",
  DUE_SOON: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
  SUBMITTED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-500",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};
