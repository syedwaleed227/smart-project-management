# 9. Client and Vendor Management

External parties with controlled portal access and full relationship history.

## Client profiles
- Fields: company name, industry, address, billing details, tax ID, account manager, status, **risk rating**.
- **Contact persons** — multiple, each with role, email, phone, portal access flag.
- **Project links** — all projects for this client.
- **Invoice & payment history** — receivables, paid/overdue.
- **Meeting history** — all client meetings + minutes shared.
- **Documents** — contracts, deliverables, shared files (permissioned).
- **Approval status** — onboarding approval state.
- **Client portal** — clients log in to see only their projects, updates, invoices, meetings, and shared docs.

## Vendor profiles
- Fields: company name, category, address, bank/payment details, tax ID, status, **risk rating**.
- **Contact persons** — as with clients.
- **Contracts** — terms, validity, linked documents; require Legal/Finance approval.
- **Project links** — projects/POs the vendor supplies.
- **Payment & invoice history** — payables, POs, paid/due.
- **Documents** — contracts, compliance certificates, delivery proofs.
- **Approval status** — vendor onboarding goes through Procurement → Finance → (Legal) approval.
- **Vendor portal** — vendors submit invoices, view POs and payment status, upload delivery docs.

## Risk rating
- Low / Medium / High, set manually or via AI signals (late delivery, disputes, overdue payments). Surfaced on dashboards and in vendor/client selection.

## Key fields
`Client(id, name, account_manager_id, tax_id, risk_rating, status)`,
`Vendor(id, name, category, bank_details, tax_id, risk_rating, status)`,
`Contact(id, party_type, party_id, name, email, phone, portal_access)`,
`Contract(id, party_type, party_id, start, end, value, status, document_id)`.
