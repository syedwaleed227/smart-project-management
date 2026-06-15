-- =============================================================================
-- 0007  Generic audit trigger
-- =============================================================================
-- One trigger function captures who/what/when/old->new for every row change on
-- the attached tables, writing an immutable record to audit_logs. SECURITY
-- DEFINER so it can always insert into audit_logs regardless of the actor's RLS.
-- =============================================================================

create or replace function app.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_action text;
  v_entity_id uuid;
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
    v_new := to_jsonb(new);
    v_entity_id := new.id;
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_entity_id := new.id;
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
    v_old := to_jsonb(old);
    v_entity_id := old.id;
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_values, new_values)
  values (auth.uid(), v_action, tg_table_name, v_entity_id, v_old, v_new);

  return coalesce(new, old);
end;
$$;

-- Attach to the entities that matter for accountability/finance/compliance.
do $$
declare
  t text;
  audited text[] := array[
    'departments','user_roles','projects','tasks','milestones',
    'budgets','budget_lines','expenses','purchase_requests','purchase_orders',
    'invoices','payments','reimbursements',
    'clients','vendors','contracts','approvals','approval_steps',
    'documents','leaves'
  ];
begin
  foreach t in array audited loop
    execute format(
      'create trigger trg_audit_%1$s after insert or update or delete on public.%1$s
         for each row execute function app.audit_trigger();', t);
  end loop;
end;
$$;
