# Task: Instagram/Facebook DM Intake → Booking Pipeline (Nha Atelier Tattoo)

## Status

- **Design draft** — decisions below are *proposed*; the owner interview has **not** been run yet. Nothing here is locked.
- Ready for review. Do **not** `git push` or trigger CI/CD (invariant #5).
- Blocked on **business input** before Phase 1 can start: service catalogue + price bands, deposit policy,
  studio working hours, and which Instagram account is the single source of truth (see *Open items*).

## Locked design decisions (proposed)

| # | Question | Decision |
| --- | --- | --- |
| 1 | Execution strategy | **Hybrid, API-first inside the authenticated page context.** The browser (antidetect CDP profile) exists **only** to hold the Instagram/Messenger web session. All DM data is read by calling Instagram's own internal endpoints (`/api/v1/direct_v2/*`) **from inside that page** (`Runtime.evaluate` → `fetch` with the page's cookies + CSRF). No DOM scraping of the thread list, no HTML parsing of message bubbles, no selector drift. |
| 2 | Job dispatch path | **Cloud `automation.jobs`** (Supabase) + fleet claim, identical to the HRMS task. The local CLI gateway (`127.0.0.1:8765`) is local-only and MUST NOT be the cloud entrypoint. |
| 3 | Scheduler host | **Supabase `pg_cron` + scheduled Edge Function** that materializes due `automation.schedules` rows into jobs. Cadence is polling, because personal Instagram accounts expose **no inbound webhook**. |
| 4 | Credentials | **Secret Store only** (`{{secrets.*}}`). `ig_username` / `ig_password` live in the encrypted store; the runtime session is reused from the browser profile snapshot. Re-login is a **manual recovery step** — headless re-login triggers Instagram challenges and is forbidden by policy. |
| 5 | Cadence + window | **Every 15 min, 08:00–21:00 Asia/Ho_Chi_Minh, Mon–Sun** (`0,15,30,45 8-21 * * *`). The studio takes bookings every day; nights are excluded to keep traffic human-like. |
| 6 | Send rollout | **Dry-run first** — classify + draft reply + build the CRM record, but send nothing. Outbound replies and deposit links are enabled **only after explicit owner approval**, and remain policy-gated with a per-thread cooldown. |
| 7 | Adapter location | **No new `tools/` package.** Per *option A*, the intake / classification / reply logic lives in `javascript-code` blocks inside the workflow (one block per concern), matching the HRMS workflow shape. |
| 8 | First target | Tenant admin `e0f30395-3d42-41f6-a4ca-c11411e4f24b`; enrolled workstation `HNDW-NDTU6` (`24cf97b1-ee98-4f1f-b6c8-b8e5d63fc48d`); **new** browser profile `atelier-ig-<seed>` (logged in manually once, then leased). |

### Cloud objects to create (proposed)

- **`automation.workflows`** row — `IG DM Booking Intake`, `status = draft`, version `1.0.0`. Proposed v1 graph (12 nodes / 11 edges):

  `trigger → new-tab(instagram.com/direct/inbox) → javascript-code(session guard) → javascript-code(read new threads via direct_v2) → conditions(has new DMs) → javascript-code(classify intent) → javascript-code(upsert CRM lead) → conditions(booking intent) → javascript-code(draft reply + deposit link) → conditions(mode == send) → javascript-code(send reply) → done-*`

- **`automation.schedules`** row — `0,15,30,45 8-21 * * *`, `timezone = 'Asia/Ho_Chi_Minh'`.
- **`secrets.credentials`** rows — `ig_username`, `ig_password` (encrypted client-side, DEK sealed per device — see §4 of the HRMS plan).
- **`browsers.profiles`** row — `atelier-ig-<seed>` with `Asia/Ho_Chi_Minh` + `vi-VN` fingerprint.

### What this changes vs. the naive approach

- **DOM scraping → structured API.** A selector-based DM reader breaks on every Instagram front-end deploy. Reading `direct_v2` JSON inside the page gives stable typed data and keeps the workflow logic in one block.
- **Stored password → session reuse.** Instagram aggressively challenges password logins from new fingerprints. The profile snapshot (cookies + device id) is the credential; the password in the Secret Store exists only for the manual recovery path.
- **Reply-all → intent-gated replies.** Replying to every DM is how accounts get reported as spam. Only threads classified as `booking_intent` (or `price_question`) are drafted, and nothing is sent until the owner approves the rollout.
- **Always-on polling → business-hours polling.** Fewer requests, more human, and it matches when the studio can actually answer.

## Objective

Turn the studio's manual DM triage into a Tuquet Automation workflow executed by an enrolled workstation.

A Supabase scheduler materializes a due `automation.schedules` row into `automation.jobs`. An enrolled workstation
running in fleet mode claims the job, opens the leased antidetect profile, reads new Instagram/Messenger threads through
the platform's own internal API from inside the authenticated page, classifies booking intent, upserts a lead into the CRM,
and (when policy allows) sends an approved reply with a deposit link — then reports status and logs back to Cloud.

Cloud must **never** open a Chromium process, **never** store the Instagram password in plaintext, and **never** send an
outbound message that the policy gate has not approved.

## Existing building blocks (verified)

Verified against the real tree on 2026-10-24:

- `tq auth login` — Cloud operator auth + workstation enrollment (`cli/src/commands/cloud.rs`).
- `tq worker` — `start` (incl. `--cloud` fleet mode), `status`, `logs` (`cli/src/commands/worker/`).
- Worker fleet transport — outbound WS client (`worker/src/transport/ws_client.rs`) + enrollment RPC (`workers.enroll_device`, `workers.heartbeat`).
- `tq automation` — `run`, `inspect`, `workflow list/import/export/info/delete` (`cli/src/commands/automation/`).
- `tq browser` — `profile list/create/inspect/pack/unpack/push/pull/cloud` + CDP runtime (`cli/src/commands/browser/`).
- **Cloud workflow store (cloud-first)** — CLI/console read and write `automation.workflows` through the `public.workflow_*` RPCs
  (`list` / `get` / `upsert` / `delete`), because PostgREST exposes only the `public` schema (`PGRST106` otherwise).
  Implemented in `cli/src/infrastructure/cloud/workflow_store.rs`; console uses `POST /rest/v1/rpc/workflow_list`.
- **Secret Store v2** — `tq secret init/set/list/rm/path/push/pull/remote/rotate` (`cli/src/commands/secret.rs`);
  local store `~/.tq/system/secrets.json` (AES-256-GCM) + device keypair X25519 (`~/.tq/system/.device_key`);
  cloud plugin `secrets` v2 (`secrets.credentials`, `secrets.tenant_keys`, `secrets.devices.wrapped_dek`).
  Engine resolves `{{secrets.<name>}}` (`worker/src/drivers/cdp/workflow.rs`) and scrubs secrets from logs (`worker/src/core/masker.rs`).
  Console page `SecretsCredentials` (`/secrets/credentials`).
- **Cloud queue (already exists)** — `automation.workflows`, `automation.jobs`, `automation.execution_logs`, `automation.schedules`,
  `automation.claim_next_job(p_worker_id, p_batch_size)` (FOR UPDATE SKIP LOCKED), `automation.reap_stale_jobs(interval)`,
  `automation.notify_job_queued()` (`cloud/supabase/plugins/automation/install.sql`).
- **Antidetect profiles + lease** — `browsers.profiles`, `browsers.fingerprint_templates`, `browsers.releases`,
  `acquire_profile` / `release_profile` (`cloud/supabase/plugins/browsers/install.sql`); engine is fingerprint-chromium
  (`~/.tq/browser/runtimes/v148.0.7778.215/chrome`).
- **Block engine** — labels verified in `worker/src/drivers/cdp/workflow.rs`:
  `trigger`, `delay`, `new-tab`, `javascript-code`, `webhook`, `conditions`, `while-loop`, `loop-data`, `insert-data`,
  `get-text`, `attribute-value`, `event-click`, `forms`, `tab-url`.
  Interpolation of `{{variables.*}}`, `{{secrets.*}}`, `{{table.*}}`, `{{loopData.*}}`.
- **CDP surface actually used by the engine** (verified): `Runtime.evaluate`, `Page.navigate/reload/enable/getFrameTree/createIsolatedWorld/captureScreenshot`,
  `Network.setCookie/getCookies/deleteCookies`, `Input.dispatchMouseEvent/dispatchKeyEvent`.
  → **There is no `Network.responseReceived` / `Fetch` interception**, so all data reads go through in-page `fetch` (decision #1).

### NOT present (must be created / located)

- **No Instagram/Messenger adapter** exists anywhere. Unlike the HRMS task there is no deleted `tools/*` to recover — Phase 1 writes it from scratch.
- **No CRM connector.** The destination for leads is undecided (see *Open items* #2). Until it is chosen, Phase 1 writes to `automation.jobs.result_summary` + a local JSON artefact only.
- **No `automation.enqueue_job`, no schedule materializer, no `pg_cron` usage, no automation Edge Function** — same gap the HRMS plan already carries (Phase 5 there).
- **No LLM/classifier integration in the engine.** v1 classification must be **rule-based** (keyword + regex over the message text) inside a `javascript-code` block. A model call would need a `webhook` block to an external endpoint — explicitly deferred.
- **No reply templates / deposit link generator.** Both are business inputs, not code inputs.

## Source of truth and audit references

### Tuquet workflow contract

| Concern | Reference | Use it for |
| --- | --- | --- |
| Workflow model | `cli/src/core/models/workflow.rs` | Rust serialization shape for workflows, nodes, edges, settings, tables. |
| Workflow schema | `cli/schema/workflow.schema.json` | JSON Schema for persisted workflow graphs. |
| Structural validation | `cli/src/core/engine/workflow_resolver/validator.rs` | Runtime acceptance rules for `nodes` and `drawflow`. |
| Workflow fixture | `cli/fixtures/google_search.workflow.json` | Working example of the persisted graph format. |
| Browser executor | `worker/src/drivers/cdp/workflow.rs` | Block labels, interpolation, branching, loops, cancellation, error handling. |
| Execution output | `worker/src/protocol/schema.rs` | Worker result, variables, tables, logs, artifacts. |
| **Cloud queue / claim** | `cloud/supabase/plugins/automation/install.sql` | `automation.jobs`, `claim_next_job`, `reap_stale_jobs`, `schedules`, notify trigger. |
| **Workflow store RPC** | same file (`public.workflow_*`) | Cloud-first workflow CRUD used by CLI + console. |
| **Secret Store** | `cloud/supabase/plugins/secrets/install.sql` (v2) · `docs/en/cloud/specs/SPEC-secret-store.md` | Encrypted credentials + device-sealed DEK. |
| **Antidetect profile + lease** | `cloud/supabase/plugins/browsers/install.sql` | `browsers.profiles`, `acquire_profile`, `release_profile`. |

### Platform-API contract (to be verified live in Phase 1)

| Concern | Reference | Use it for |
| --- | --- | --- |
| Inbox listing | `GET /api/v1/direct_v2/inbox/?visual_message_return_type=unseen&limit=20` (called **from the page**) | Thread list + `last_activity_at`, `items[].item_type`. |
| Thread detail | `GET /api/v1/direct_v2/threads/{thread_id}/` | Message history, participants, `next_cursor`. |
| Send message | `POST /api/v1/direct_v2/threads/broadcast/text/` | Outbound reply (policy-gated). |
| Required headers | `x-ig-app-id`, `x-csrftoken` (from the page's cookie), `x-requested-with: XMLHttpRequest` | Anti-CSRF; values are read **at runtime** from the page, never hard-coded. |
| Session artefacts | cookies `sessionid`, `csrftoken`, `ds_user_id` | Read via `Network.getCookies` for the session guard block. |

> **These endpoints are undocumented and can change without notice.** Phase 1 must capture the real response shapes
> from a live authenticated session before the workflow is written, and the workflow must **fail closed** (no send) when a
> shape assertion does not hold.

### Audit rules

1. Any claim in this document that is not backed by a file path or a live-verified response must be marked `ASSUMPTION`.
2. Never hard-code a selector, an app id, or a CSRF token. Read them at runtime from the page.
3. Never send an outbound message while `mode == dry-run`.
4. Never write a customer phone number, address, or full name into logs — mask to `***` (see *Security requirements*).

## Scope

### In scope (v1)

- Instagram **Direct** intake for the studio's primary account (new threads + new messages on known threads).
- Rule-based intent classification: `booking_intent`, `price_question`, `reschedule`, `other`.
- CRM/lead upsert (destination TBD) with: thread id, handle, first message, classification, timestamps.
- Reply drafting from templates + deposit link, **dry-run by default**.
- Per-thread cooldown (no reply more than once per 6 h) and a hard daily send cap.
- Structured job output for the console + `automation.execution_logs`.

### Out of scope (first implementation)

- **Facebook Messenger** (v2 — different API surface, same design).
- Comments, story replies, and post-DM funnels.
- Payments/booking confirmation (the pipeline stops at "deposit link sent").
- LLM-based classification or free-form reply generation.
- Auto-reply to `other`/spam threads (they are recorded, never answered).
- Multi-account / multi-studio tenancy.

## Target flow

```
[pg_cron every 15 min, 08:00–21:00 VN]
        │
        ▼
automation.tick_schedules()  ──►  automation.enqueue_job(workflow='IG DM Booking Intake', params)
        │                                     │
        │                                     ▼
        │                          automation.jobs (status=queued)
        │                                     │  pg_notify
        ▼                                     ▼
   (next tick)                    enrolled workstation (fleet mode)
                                              │ claim_next_job
                                              ▼
                              acquire_profile('atelier-ig-<seed>')   ← lease, 1 session only
                                              │
                              browser: new-tab(instagram.com/direct/inbox)
                                              │
                              session guard: cookies present? token valid?
                                   ├─ no  → fail closed, release lease, alert
                                   └─ yes → read direct_v2/inbox (in-page fetch)
                                              │
                                   filter: last_activity_at > cursor && unseen
                                              │
                                   classify intent (rules)  ──► CRM upsert (lead)
                                              │
                                   booking_intent? ──► draft reply + deposit link
                                              │
                                   mode == send AND policy approved?
                                   ├─ no  → store draft, release lease, done
                                   └─ yes → send (paced), record, release lease
```

## Contracts

### Workflow job parameters (stored in `automation.jobs.parameters`)

```jsonc
{
  "mode": "dry-run",              // dry-run | send   (send requires policy approval)
  "platform": "instagram",        // instagram | messenger
  "profile": "atelier-ig-<seed>", // browser profile to lease
  "cursor": "2026-10-24T00:00:00Z", // only threads active after this
  "max_threads": 20,              // hard cap per run
  "max_sends": 5,                 // hard cap per run (independent of mode)
  "cooldown_hours": 6,            // per-thread reply cooldown
  "reply_templates": {
    "booking_intent": "…",        // owner-supplied; may contain {{slot}} / {{deposit_link}}
    "price_question": "…"
  },
  "deposit_link": "https://…"     // owner-supplied, not generated
}
```

### Cloud enqueue contract (new SQL helper — shared with the HRMS plan)

```sql
-- automation.enqueue_job(p_workflow_id uuid, p_tenant_id uuid, p_parameters jsonb, p_idempotency_key text)
-- Inserts into automation.jobs (status='queued'), fires notify_job_queued().
-- MUST be idempotent on (workflow_id, idempotency_key): a duplicate tick must not double-send.
```

### Scheduler contract (new SQL helper + pg_cron — shared with the HRMS plan)

```sql
-- automation.tick_schedules()  → materializes due automation.schedules rows into jobs.
-- pg_cron:  */15 1-14 * * *   (UTC)   ⇒ 08:00–21:00 Asia/Ho_Chi_Minh, every 15 min
```

### Job output (`automation.jobs.result_summary`)

```jsonc
{
  "scanned_threads": 12,
  "new_messages": 4,
  "classified": { "booking_intent": 2, "price_question": 1, "other": 1 },
  "leads_upserted": 3,
  "drafts_created": 3,
  "sent": 0,                      // 0 in dry-run — MUST stay 0 until rollout
  "skipped": [{ "thread_id": "…", "reason": "cooldown" }],
  "errors": []
}
```

## Implementation tasks

### Phase 1 — Capture the DM contract from a live session

1. Create the antidetect profile `atelier-ig-<seed>` (timezone `Asia/Ho_Chi_Minh`, locale `vi-VN`, seed recorded in the profile notes).
2. Log in **manually** through the profile, once.
3. From inside the page, call the three endpoints above and **record the real response shapes** into `tasks/ig-dm-contract.md` (field names, pagination cursors, thread vs. message ids).
4. Write assertions for the fields the workflow depends on; anything that does not match must fail closed.

**Verify:** a recorded response contains `thread_id`, `last_activity_at`, and at least one text item; `tq browser profile inspect atelier-ig-<seed>` shows the seed + timezone.

### Phase 2 — Build the workflow graph

1. Author the 12-node graph (see *Cloud objects to create*) and upsert it through the cloud-first store (`public.workflow_upsert`).
2. Keep each concern in one block: session guard / read / classify / CRM upsert / draft / send.
3. Store **no** credential and **no** deposit link inside the graph — both come from job parameters or `{{secrets.*}}`.

**Verify:** `tq automation inspect` passes schema + structural validation; `workflow_get` returns the graph with `has_cred = false`.

### Phase 3 — Workstation, browser, worker

1. Run the workflow locally in dry-run against the profile.
2. Confirm the lease is acquired and **released even on failure** (no stuck lock).
3. Confirm the job claims correctly in fleet mode.

**Verify:** two concurrent runs cannot hold the same profile; `browsers.profiles` shows no `locked_by` after a failed run.

### Phase 4 — Secrets and session reuse

1. `tq secret set ig_username` / `ig_password` (encrypted store; never in the graph, payload, logs, or git).
2. Confirm the engine resolves `{{secrets.ig_*}}` and that `masker` scrubs the values from logs.
3. Confirm the session is reused from the profile snapshot — the password is **never** used at runtime.
4. `tq secret push` so a second machine can `pull` and run the same job.

**Verify:** job payload + logs contain no plaintext; a fresh machine with only `tq secret pull` runs the workflow.

### Phase 5 — Cloud scheduling and enqueue

1. Add `automation.enqueue_job` + `automation.tick_schedules` (needs owner approval — schema change).
2. Create the `automation.schedules` row and the `pg_cron` entry.
3. Make the enqueue idempotent per tick (no double job for the same window).

**Verify:** a simulated tick inserts exactly one job; a repeated tick inserts none.

### Phase 6 — Observability and safe rollout

1. Per-run summary → console + `automation.execution_logs`; alert only when `errors.length > 0` or the session guard fails.
2. Run dry-run for several full days; compare drafts against what the owner would have replied.
3. Enable `mode = send` **only after explicit approval**, with `max_sends` low and a manual kill switch (`automation.schedules.enabled = false`).

**Verify:** a dry-run day produces drafts and `sent = 0`; disabling the schedule stops new jobs within one tick.

## Recommended first slice

Phases **1 → 2 → 3 in dry-run**, on the single primary Instagram account, with `max_threads = 5`.
No CRM writes, no drafts sent — the deliverable is a recorded contract plus a workflow that reports a truthful summary.
Everything that sends stays off until the owner reads a week of drafts.

## Verification commands

```bash
# Profile readiness
tq browser profile list
tq browser profile inspect atelier-ig-<seed>

# Secrets
tq secret list
tq secret remote

# Workflow validation + local dry-run (positional arg is a FILE path)
tq automation inspect /tmp/ig-dm-booking.workflow.json
tq automation run /tmp/ig-dm-booking.workflow.json -p mode=dry-run -p max_threads=5

# Cloud (after Phase 5)
#   select status, result_summary from automation.jobs
#   where workflow_id = '<IG DM Booking Intake id>' order by created_at desc limit 5;
```

## Security requirements

- **Zero plaintext credential** in `graph_data`, job payload, logs, audit rows, or git — `{{secrets.*}}` only.
- **One session per profile.** Instagram bans on concurrent sessions; the `browsers.profiles` lease is mandatory, and a stale lease must be reaped, not bypassed.
- **PII masking.** Customer handles, phone numbers, and addresses are masked in logs; only the CRM receives the raw values.
- **Fail closed.** Session guard failure, shape-assertion failure, or policy denial ⇒ no send, release the lease, alert.
- **Rate discipline.** `max_threads` / `max_sends` caps + per-thread cooldown + randomised pacing (`delay` block) — never a tight loop.
- **No CI/CD push** and no cloud schema change without explicit owner approval (invariants #4, #5).

## Risks

| Risk | Level | Mitigation |
| --- | --- | --- |
| Instagram account restriction / ban | **High** | antidetect profile + one session + business-hours polling + low caps + no headless re-login; stop on first challenge |
| Undocumented endpoint drift | High | Phase 1 records the contract; shape assertions; fail closed; the whole read path lives in one block |
| Reply perceived as spam → user reports | High | intent-gated replies only; dry-run rollout; per-thread cooldown; owner-approved templates |
| Misclassification (booking treated as `other`) | Medium | conservative rules; log every classification with the raw text for owner review |
| Concurrent session from the studio's own phone | Medium | lease + session guard; the workflow never logs in when a session is already active elsewhere |
| CRM destination not chosen yet | Medium | v1 writes to job output only; CRM connector is Phase 6+ work |
| Deposit link / pricing wrong in a template | High | templates are owner-supplied job parameters; a template change requires a new job, never an in-graph edit |

## Open items

1. **Which Instagram account** is the source of truth (personal vs. business/creator)? Business accounts may expose the Messenger Platform API — that would remove the browser from the read path entirely and change decision #1.
2. **CRM destination** — Supabase table in `cloud`, an external CRM, or a spreadsheet? Blocks the upsert block.
3. **Service catalogue + price bands** — needed for `price_question` drafts.
4. **Deposit policy + link** (amount, provider, expiry).
5. **Studio working hours** — used for reply windows and expected response time.
6. **Reply templates** in Vietnamese + English (the studio gets both).
7. **Schema change approval** for `automation.enqueue_job` / `automation.tick_schedules` (shared with the HRMS plan).
8. **Which machine runs the worker** (shared with the HRMS plan — the VPS has no `tq`; the enrolled device is Windows).
9. **Messenger in v2?** — decide before Phase 6 to avoid re-authoring the read block.
10. **Data retention** — how long to keep DM excerpts (PII) in `execution_logs`?

## Data model (proposed)

### Lead record (CRM destination TBD — see *Open items* #2)

```sql
-- Shape the upsert block targets. Column names are the contract; the destination may be
-- a cloud table, an external CRM, or a sheet — only the field set is fixed here.
create table if not exists atelier.leads (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  platform        text not null check (platform in ('instagram','messenger')),
  thread_id       text not null,
  handle          text not null,
  display_name    text,
  first_message   text,                     -- raw, PII-masked in logs only
  last_intent     text not null,            -- booking_intent | price_question | reschedule | other
  intent_history  jsonb not null default '[]'::jsonb,
  status          text not null default 'new',   -- new | drafted | replied | booked | dropped
  deposit_link    text,
  replied_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, platform, thread_id)
);
```

### Thread cursor (idempotency across ticks)

The workflow must not re-classify the same message twice, and must not re-draft a thread that
already has an open draft. Two mechanisms, both required:

| Concern | Mechanism |
| --- | --- |
| Which threads are new | `parameters.cursor` (job payload) — advanced to `max(last_activity_at)` after a successful run |
| Which threads already have a draft | `atelier.leads.status` — a thread in `drafted` is skipped until the owner acts |
| Which runs already happened | `automation.jobs.idempotency_key` = `ig-dm:<window_start_iso>` (needs the schema change) |
| Cooldown | `replied_at + cooldown_hours > now()` ⇒ skip with `reason: cooldown` |

## Classification rules (v1 — rules only)

| Intent | Signals (regex over the masked preview, VI + EN) | Action in dry-run | Action in send |
| --- | --- | --- | --- |
| `booking_intent` | `đặt lịch`, `book`, `booking`, `lịch hẹn`, `appointment`, `thứ \d`, `tuần sau` | draft reply + deposit link | send (if policy + cooldown ok) |
| `price_question` | `giá`, `bao nhiêu`, `price`, `cost`, `how much`, `size \d+cm` | draft reply (catalogue) | send (if policy + cooldown ok) |
| `reschedule` | `dời`, `lùi`, `đổi lịch`, `reschedule`, `postpone` | draft reply + hand-off note | **never auto-send** — owner handles |
| `other` | no rule matched | record only | never send |

Rules are evaluated **in order**; the first match wins. A thread whose preview matches nothing is
recorded as `other` and is never answered automatically — silent misclassification is worse than
an unanswered DM. Every classification is logged with the raw preview (masked) so the owner can
audit false negatives during the dry-run period and propose rule changes as a **new job**, not an
in-graph edit.

## Console surface (what the owner reviews)

| Surface | Purpose |
| --- | --- |
| `automation/workflows` → `IG DM Booking Intake` | Graph + version; must show `has_cred = false` |
| Job run detail (`automation.jobs.result_summary`) | Per-run counters from the *Job output* contract |
| Drafts review (to be built, Phase 6) | List `atelier.leads` where `status = 'drafted'` with the drafted text, so the owner can approve/deny in bulk before `mode = send` is ever enabled |
| `automation/execution-logs` | Fail-closed events (session guard, shape assertion, policy denial) |

The drafts-review surface is the **gate** for the rollout: `mode = send` stays off until the owner
has reviewed a week of drafts and agreed with the classifications.

## Acceptance criteria

1. **Contract recorded.** `tasks/ig-dm-contract.md` exists with real captured response shapes, and every field the workflow reads is asserted.
2. **Zero plaintext.** Job payload, `graph_data`, `execution_logs`, and git contain no Instagram credential; `tq secret remote` shows ciphertext only.
3. **Lease safety.** Two concurrent runs cannot hold `atelier-ig-<seed>`; a failed run leaves no `locked_by`.
4. **Truthful dry-run.** A dry-run day reports `drafts_created > 0` and **`sent = 0`**, and every draft corresponds to a real DM in the inbox.
5. **Idempotent ticks.** A repeated scheduler tick for the same window enqueues no second job.
6. **Fail closed.** Killing the session (clearing cookies) makes the run report `no_session` and send nothing.
7. **Caps honoured.** `max_threads` and `max_sends` are never exceeded, even when the inbox has more new DMs.
8. **No scheduler-side browser.** The Edge Function/pg_cron path never launches Chromium and never runs Node CLI logic.

## Reference code (to be written — nothing exists to recover)

Unlike the HRMS task, there is **no** previous adapter to rewrite. The snippets below are the intended shape, not recovered code.

```js
// Block: session guard  (javascript-code)
// Runs in the page context on instagram.com/direct/inbox.
const cookies = Object.fromEntries(document.cookie.split('; ').map(c => c.split('=')));
const ok = Boolean(cookies.sessionid && cookies.csrftoken && cookies.ds_user_id);
if (!ok) {
  // Fail closed: no send, no CRM write. The engine records the failure and releases the lease.
  return { ok: false, reason: 'no_session' };
}
return { ok: true, ds_user_id: cookies.ds_user_id };
```

```js
// Block: read new threads  (javascript-code)
// In-page fetch so the request carries the real session cookies + CSRF header.
const csrf = Object.fromEntries(document.cookie.split('; ').map(c => c.split('='))).csrftoken;
const appId = window.__ig_app_id || document.querySelector('meta[name="app-id"]')?.content;
if (!appId) return { ok: false, reason: 'no_app_id' };

const res = await fetch('/api/v1/direct_v2/inbox/?visual_message_return_type=unseen&limit=20', {
  headers: { 'x-csrftoken': csrf, 'x-ig-app-id': appId, 'x-requested-with': 'XMLHttpRequest' },
  credentials: 'include',
});
if (!res.ok) return { ok: false, reason: `http_${res.status}` };
const data = await res.json();

const cursor = new Date(parameters.cursor).getTime();
const threads = (data.inbox?.threads ?? [])
  .filter(t => new Date(t.last_activity_at).getTime() > cursor)
  .slice(0, parameters.max_threads)
  .map(t => ({
    thread_id: t.thread_id,
    handle: t.users?.[0]?.username,
    last_activity_at: t.last_activity_at,
    preview: (t.items?.[0]?.text ?? '').slice(0, 500),
  }));
return { ok: true, threads };
```

```js
// Block: classify intent  (javascript-code, rules only — no model call in v1)
const RULES = [
  ['booking_intent',  /(đặt lịch|book|booking|lịch hẹn|appointment|tuần sau|thứ \d)/i],
  ['price_question',  /(giá|bao nhiêu|price|cost|how much|size \d+cm)/i],
  ['reschedule',      /(dời|lùi|đổi lịch|reschedule|postpone)/i],
];
const out = [];
for (const t of variables.threads ?? []) {
  const hit = RULES.find(([, re]) => re.test(t.preview));
  out.push({ ...t, intent: hit ? hit[0] : 'other' });
}
return { classified: out };
```

> These snippets are **sketches**. Phase 1 replaces every field name with the one actually observed in the live
> `direct_v2` response, and every assertion must be re-derived from that capture.
