# 14. Audit Trail and Security

Security and accountability are foundational, not add-ons.

## Audit trail
Every create/edit/approve/reject/delete on important entities records:
- **Who** created / edited / approved / rejected.
- **What** entity and action.
- **When** — exact date & time (UTC + local).
- **Old → new values** — field-level change diff.
- **Login activity** — successful/failed logins, device, IP.
- **Permission changes** — role/scope grants and revocations.

Audit logs are **append-only/immutable**, retained per policy, and viewable by Auditors/Admins. They power the [Audit report](12-dashboards-and-reporting.md).

```
AuditLog(id, actor_id, action, entity_type, entity_id,
         old_values json, new_values json, ip, user_agent, created_at)
```

## Access control
- **Role-based access control (RBAC)** — capabilities granted by role.
- **Department-based access** — data scoped to a user's department(s); cross-department needs explicit grant.
- **Attribute/condition rules** — e.g., approve only below a threshold.
- **Least privilege** by default; external portals are tightly sandboxed.

## Authentication & protection
- **Two-factor authentication (2FA)** — TOTP/SMS/email; enforceable per role.
- **SSO / OAuth** (later) — Google/Microsoft.
- **Session management** — timeouts, device list, forced logout.
- **Password policy** — strength, rotation, lockout on brute force.

## Data protection
- **Data encryption** — TLS in transit; AES-256 at rest (DB + files).
- **Data backup** — automated, scheduled, tested restores; point-in-time recovery.
- **Activity logs** — security/system event logging + alerting on anomalies.
- **Export restrictions** — control who can export/download; watermark and log exports; block for restricted roles.
- **Compliance posture** — supports GDPR-style data requests, retention rules, and audit readiness.
