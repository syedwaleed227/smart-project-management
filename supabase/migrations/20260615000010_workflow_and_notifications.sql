-- =============================================================================
-- 0010  Approval workflow engine + notification system
-- =============================================================================
-- Implements, in the database (so it is transactional and testable):
--   * Condition matching to pick the right workflow for an entity.
--   * start_approval(): creates an approval + its steps and notifies the first
--     approvers.
--   * decide_approval_step(): authorizes the caller, records the decision,
--     handles parallel-quorum and sequential advancement, applies the outcome
--     to the linked entity, and fires notifications.
--   * Notification helper + triggers (task assigned, budget exceeded).
-- The two RPCs are exposed to the app via PostgREST (supabase.rpc(...)).
-- =============================================================================

-- ---- Notifications ----------------------------------------------------------
create or replace function app.notify(
  p_user uuid, p_type text, p_entity_type text, p_entity_id uuid, p_message text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_user is null then return; end if;
  insert into public.notifications (user_id, type, entity_type, entity_id, channel, message, status, sent_at)
  values (p_user, p_type, p_entity_type, p_entity_id, 'in_app', p_message, 'sent', now());
end;
$$;

-- Resolve a workflow step's approver_ref ({kind, value}) into concrete user ids.
create or replace function app.resolve_approvers(p_ref jsonb, p_requester uuid)
returns setof uuid
language plpgsql stable security definer set search_path = public, app as $$
declare
  v_kind text := p_ref->>'kind';
  v_val  text := p_ref->>'value';
begin
  if v_kind = 'user' then
    return query select v_val::uuid;
  elsif v_kind = 'role' then
    return query
      select ur.user_id from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where r.name = v_val;
  elsif v_kind = 'manager' then
    return query
      select mgr.user_id from public.employees e
      join public.employees mgr on mgr.id = e.manager_id
      where e.user_id = p_requester;
  end if;
  return;
end;
$$;

create or replace function app.notify_step_approvers(p_approval uuid, p_position int)
returns void
language plpgsql security definer set search_path = public, app as $$
declare
  s record; u uuid;
  v_etype text; v_eid uuid; v_req uuid;
begin
  select entity_type, entity_id, requested_by into v_etype, v_eid, v_req
  from public.approvals where id = p_approval;

  for s in
    select * from public.approval_steps
    where approval_id = p_approval and position = p_position and status = 'pending'
  loop
    for u in select * from app.resolve_approvers(s.approver_ref, v_req) loop
      perform app.notify(u, 'approval_pending', v_etype, v_eid,
        format('Approval needed: %s request', v_etype));
    end loop;
  end loop;
end;
$$;

-- ---- Condition matching -----------------------------------------------------
create or replace function app.workflow_matches(
  p_conditions jsonb, p_amount numeric, p_department_id uuid
) returns boolean
language plpgsql stable set search_path = public as $$
declare c jsonb; f text; op text; v text; ok boolean;
begin
  if p_conditions is null or jsonb_array_length(p_conditions) = 0 then
    return true;
  end if;
  for c in select * from jsonb_array_elements(p_conditions) loop
    f := c->>'field'; op := c->>'op'; v := c->>'value';
    if f = 'amount' then
      if p_amount is null then return false; end if;
      ok := case op
        when '>'  then p_amount >  v::numeric
        when '>=' then p_amount >= v::numeric
        when '<'  then p_amount <  v::numeric
        when '<=' then p_amount <= v::numeric
        when '='  then p_amount =  v::numeric
        else false end;
    elsif f = 'department' then
      ok := p_department_id is not null and p_department_id::text = v;
    else
      ok := true; -- unknown field: ignore
    end if;
    if not ok then return false; end if;
  end loop;
  return true;
end;
$$;

-- ---- Apply an approval outcome to the linked entity -------------------------
create or replace function app.apply_approval_outcome(
  p_entity_type text, p_entity_id uuid, p_approved boolean
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_entity_type = 'expense' then
    update public.expenses set status = case when p_approved then 'approved' else 'rejected' end where id = p_entity_id;
  elsif p_entity_type = 'leave' then
    update public.leaves set status = case when p_approved then 'approved' else 'rejected' end where id = p_entity_id;
  elsif p_entity_type = 'budget' then
    update public.budgets set status = case when p_approved then 'approved' else 'rejected' end where id = p_entity_id;
  elsif p_entity_type = 'purchase_request' then
    update public.purchase_requests set status = case when p_approved then 'approved' else 'rejected' end where id = p_entity_id;
  elsif p_entity_type = 'invoice' then
    update public.invoices set status = case when p_approved then 'approved' else 'draft' end where id = p_entity_id;
  end if;
end;
$$;

-- ---- start_approval: create approval + steps, notify first approvers --------
create or replace function public.start_approval(
  p_entity_type text,
  p_entity_id uuid,
  p_amount numeric default null,
  p_department_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public, app as $$
declare
  wf public.workflows%rowtype;
  v_approval uuid;
  step jsonb;
  v_requester uuid := auth.uid();
begin
  select * into wf from public.workflows
   where entity_type = p_entity_type and active
     and app.workflow_matches(conditions, p_amount, p_department_id)
   order by jsonb_array_length(conditions) desc, created_at asc
   limit 1;

  insert into public.approvals (entity_type, entity_id, workflow_id, status, current_step, requested_by)
  values (p_entity_type, p_entity_id, wf.id, 'pending', 1, v_requester)
  returning id into v_approval;

  if wf.id is not null then
    for step in select * from jsonb_array_elements(wf.steps) loop
      insert into public.approval_steps
        (approval_id, position, type, approver_ref, status, sla_hours, escalate_to)
      values (
        v_approval,
        coalesce((step->>'position')::int, 1),
        coalesce(step->>'type', 'sequential'),
        step->'approver_ref',
        'pending',
        (step->>'sla_hours')::int,
        step->'escalate_to'
      );
    end loop;
  else
    -- Fallback when no workflow matched: a single Department Head step.
    insert into public.approval_steps (approval_id, position, type, approver_ref, status)
    values (v_approval, 1, 'sequential', jsonb_build_object('kind','role','value','Department Head'), 'pending');
  end if;

  perform app.notify_step_approvers(v_approval, 1);
  return v_approval;
end;
$$;

-- ---- decide_approval_step: the core decision logic --------------------------
create or replace function public.decide_approval_step(
  p_approval uuid,
  p_decision text,
  p_reason text default null
) returns text
language plpgsql security definer set search_path = public, app as $$
declare
  v public.approvals%rowtype;
  v_caller uuid := auth.uid();
  v_allowed boolean;
  v_next int;
begin
  if p_decision not in ('approved','rejected') then
    raise exception 'invalid decision %', p_decision;
  end if;

  select * into v from public.approvals where id = p_approval;
  if not found then raise exception 'approval not found'; end if;
  if v.status <> 'pending' then raise exception 'approval already %', v.status; end if;

  -- Caller must be a resolved approver of a pending step at the current
  -- position (or a Super Admin).
  select exists (
    select 1 from public.approval_steps s
    where s.approval_id = p_approval and s.position = v.current_step and s.status = 'pending'
      and (app.is_super_admin()
           or v_caller in (select app.resolve_approvers(s.approver_ref, v.requested_by)))
  ) into v_allowed;
  if not v_allowed then raise exception 'not authorized to act on this approval step'; end if;

  if p_decision = 'rejected' then
    update public.approval_steps
      set status='rejected', decided_by=v_caller, decision='rejected', reason=p_reason, decided_at=now()
      where approval_id=p_approval and position=v.current_step and status='pending';
    update public.approvals set status='rejected' where id=p_approval;
    perform app.apply_approval_outcome(v.entity_type, v.entity_id, false);
    perform app.notify(v.requested_by, 'approval_rejected', v.entity_type, v.entity_id,
      'Your request was rejected');
    return 'rejected';
  end if;

  -- Approved: mark the caller's matching pending step(s) at this position done.
  update public.approval_steps
    set status='approved', decided_by=v_caller, decision='approved', reason=p_reason, decided_at=now()
    where approval_id=p_approval and position=v.current_step and status='pending'
      and (app.is_super_admin()
           or v_caller in (select app.resolve_approvers(approver_ref, v.requested_by)));

  -- Parallel quorum: if pending steps remain at this position, keep waiting.
  if exists (select 1 from public.approval_steps
             where approval_id=p_approval and position=v.current_step and status='pending') then
    return 'pending';
  end if;

  -- Sequential advance: move to the next position with pending steps.
  select min(position) into v_next from public.approval_steps
    where approval_id=p_approval and position > v.current_step and status='pending';

  if v_next is null then
    update public.approvals set status='approved' where id=p_approval;
    perform app.apply_approval_outcome(v.entity_type, v.entity_id, true);
    perform app.notify(v.requested_by, 'approval_accepted', v.entity_type, v.entity_id,
      'Your request was approved');
    return 'approved';
  else
    update public.approvals set current_step=v_next where id=p_approval;
    perform app.notify_step_approvers(p_approval, v_next);
    return 'advanced';
  end if;
end;
$$;

grant execute on function public.start_approval(text, uuid, numeric, uuid) to authenticated;
grant execute on function public.decide_approval_step(uuid, text, text) to authenticated;

-- ---- Event triggers ---------------------------------------------------------
-- Notify a user when a task is assigned to them (skip self-assignment).
create or replace function app.notify_task_assigned()
returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  if new.assignee_id is not null
     and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id)
     and new.assignee_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  then
    perform app.notify(new.assignee_id, 'task_assigned', 'task', new.id,
      format('You were assigned: %s', new.title));
  end if;
  return new;
end;
$$;

create trigger trg_notify_task_assigned
  after insert or update of assignee_id on public.tasks
  for each row execute function app.notify_task_assigned();

-- Notify the project owner when approved spend reaches/exceeds the budget.
create or replace function app.check_budget_alert()
returns trigger language plpgsql security definer set search_path = public, app as $$
declare v_budget numeric; v_spent numeric; v_owner uuid;
begin
  if new.project_id is null or new.status not in ('approved','paid') then
    return new;
  end if;
  select total into v_budget from public.budgets
    where scope='project' and scope_id=new.project_id and status in ('approved','baselined')
    order by version desc limit 1;
  if v_budget is null or v_budget = 0 then return new; end if;

  select coalesce(sum(amount + tax),0) into v_spent from public.expenses
    where project_id=new.project_id and status in ('approved','paid');

  if v_spent >= v_budget then
    select owner_id into v_owner from public.projects where id=new.project_id;
    perform app.notify(v_owner, 'budget_exceeded', 'project', new.project_id,
      format('Budget exceeded: spend %s of %s', round(v_spent), round(v_budget)));
  end if;
  return new;
end;
$$;

create trigger trg_budget_alert
  after insert or update of status on public.expenses
  for each row execute function app.check_budget_alert();
