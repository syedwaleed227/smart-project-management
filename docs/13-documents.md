# 13. Documents and File Management

A central, permissioned document store. Files attach to any entity (project, task, finance record, meeting, client, vendor, employee) and inherit that entity's access rules.

## Document categories
- **Project documents** — specs, deliverables, plans.
- **Finance documents** — invoices, receipts, budgets, statements.
- **Legal documents** — contracts, NDAs, compliance.
- **HR documents** — employee contracts, IDs, certificates.
- **Meeting files** — agendas, slides, recordings, minutes.
- **Vendor documents** — POs, delivery proofs, certificates.
- **Client documents** — shared deliverables, sign-offs.

## Capabilities
- **File permissions** — view/download/edit per role, department, and entity link; internal-only vs client/vendor-shared.
- **Version history** — every upload keeps prior versions; restore + see who changed what.
- **Download access** — controlled and logged; can be disabled for sensitive files.
- **Approval-linked documents** — documents can be attached to approvals (e.g., receipt → expense approval) and locked once approved.
- **Tags & search** — full-text + metadata search ([smart search](15-automation-and-ai.md)).
- **Storage** — cloud object storage (S3-compatible) with encryption at rest.

## Key fields
`Document(id, name, category, entity_type, entity_id, version, current_version_id, uploaded_by, visibility, created_at)`,
`DocumentVersion(id, document_id, version_no, file_url, size, checksum, uploaded_by, uploaded_at)`,
`DocumentPermission(document_id, role/department/user, can_view, can_download, can_edit)`.
