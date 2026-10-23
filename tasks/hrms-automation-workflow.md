# Task: HRMS Automation Workflow on Tuquet

## Status

- **Design locked** (decisions resolved in the interview — see *Locked design decisions*).
- Ready for implementation. Do not `git push` or trigger CI/CD (invariant #5).
- Blocked only on one runtime input: the first **tenant / workstation / browser profile** (see *Open items*).

## Locked design decisions

| # | Question | Decision |
| --- | --- | --- |
| 1 | Execution strategy | **Hybrid** — HRMS REST API (`fetch` + JWT) for read / analysis / submit; browser (CDP) only for login + session/token acquisition. |
| 2 | Job dispatch path | **Cloud `automation.jobs`** (Supabase). Cloud scheduler enqueues into `automation.jobs`; the enrolled workstation runs in **fleet mode** and claims via `automation.claim_next_job`. The local CLI gateway (`POST /api/v1/jobs`, i.e. `127.0.0.1:8765`) is **local-only** and MUST NOT be the cloud entrypoint. |
| 3 | Scheduler host | **Supabase `pg_cron` + an Edge Function (scheduled)** that materializes due rows of `automation.schedules` into `automation.jobs`. |
| 4 | HRMS credentials | **None stored.** Auth relies on an already-authenticated browser profile (`hrms-cmc`). The JWT is read out of that profile's session. No password anywhere (not in DB, not in job payload, not in logs). Headless re-login is a **manual recovery step only**. |
| 5 | Schedule + cutoff | **08:00 Asia/Ho_Chi_Minh, Mon–Fri.** Cutoff = end of the previous day; only dates strictly `< today` are eligible (never today/future). |
| 6 | Submit rollout | **Dry-run first** for several full workdays. `submit` mode is enabled **only after explicit owner approval**; policy-gated. |
| 7 | `tools/hrms` source | The directory **no longer exists**. The adapter is **rewritten from the snippets in this task** (they are the source of truth), with mock tests. |
| 8 | First target | **Admin tenant** — `Nguyen Dinh Tu (Superadmin)'s Workspace` (`e0f30395-3d42-41f6-a4ca-c11411e4f24b`); enrolled workstation **`HNDW-NDTU6`** (`24cf97b1-ee98-4f1f-b6c8-b8e5d63fc48d`, status `idle`). Browser profile: `hrms-cmc` (login once, manually). |

### Cloud objects created

- **`automation.workflows`** row: `HRMS Timesheet Review` — id `a27093ce-a768-4e3a-bcc1-e4d87da6157c`, tenant admin, `status = draft`, version `1.0.0`. Hybrid v0 graph: 10 nodes / 9 edges (schema-valid). Flow: `trigger → new-tab(HRMS) → javascript-code(read JWT from profile) → conditions(session guard) → javascript-code(scan + absent_time analysis) → conditions(mode==submit) → javascript-code(submit) → done`. Pending: `tq automation inspect` validation + iteration.

### What this changes vs. the original draft

- The original "Target Flow" implied `Cloud Cron → POST /api/v1/jobs`. That endpoint is the **localhost daemon gateway** and is unreachable from a cloud scheduler. Replaced with the Supabase `automation.jobs` queue + fleet claim.
- The original Cloud Cron pseudocode (`fetch(.../api/v1/jobs)`) is superseded by `automation.enqueue_job(...)` (new) + `automation.tick_schedules()` (new, driven by pg_cron).
- The Supabase queue **already exists** (`automation.jobs`, `claim_next_job`, `reap_stale_jobs`, `notify_job_queued`, `automation.schedules`). Phase 5 becomes *"add the enqueue + scheduler glue"*, not *"build a queue"*.

## Objective

Turn the existing HRMS client logic into a Tuquet Automation workflow executed by an enrolled workstation.

A Supabase scheduler materializes a due `automation.schedules` row into a job in `automation.jobs`. An enrolled workstation running in fleet mode (`tq worker start --cloud`) claims the job, runs the `hrms-timesheet-review` workflow through the native automation + browser engines (CDP for session, API for HRMS calls), and reports status and logs back to Cloud.

Cloud must **never** run the HRMS Node CLI directly and **never** depend on a native Chromium process inside the scheduler.

## Existing building blocks (verified)

Verified against the real tree on 2026-10-23:

- `tq auth login` — Cloud operator auth + workstation enrollment (`cli/src/commands/cloud.rs`).
- `tq worker` — `start` (incl. `--cloud` fleet mode), `status`, `logs` (`cli/src/commands/worker/`).
- Worker fleet transport — outbound WS client (`worker/src/transport/ws_client.rs`) + enrollment via Supabase RPC (`worker/src/core/enrollment.rs` → `workers.enroll_device`, `workers.heartbeat`).
- `tq automation` — `run`, `inspect`, `workflow list/import/export/info/delete` (`cli/src/commands/automation/`).
- `tq browser` — `profile list/create/inspect/pack/unpack/push/pull/cloud`, CDP runtime (`cli/src/commands/browser/`).
- Worker CDP workflow engine — supported labels include `trigger`, `conditions`/`while-loop`, `javascript-code`, `webhook`, `attribute-value`; interpolation of `{{variables.*}}`, `{{table.*}}`, `{{loopData.*}}` (`worker/src/drivers/cdp/workflow.rs`).
- **Cloud queue (already exists)** — `automation.workflows`, `automation.jobs`, `automation.execution_logs`, `automation.schedules`, `automation.packages`; `automation.claim_next_job(p_worker_id, p_batch_size)` (FOR UPDATE SKIP LOCKED), `automation.reap_stale_jobs(interval)`, `automation.notify_job_queued()` → `pg_notify('automation_job_dispatch', …)`; enum `automation.job_status = pending|queued|running|paused|completed|failed|cancelled` (`cloud/supabase/plugins/automation/install.sql`).
- `workers.devices` — `device_status = offline|idle|busy|maintenance|disabled`, `enroll_device`, `heartbeat` (`cloud/supabase/plugins/workers/install.sql`).

### NOT present (must be created / located)

- **`tools/hrms` does not exist** anywhere in the workspace or on disk. Adapter must be rewritten from the snippets in this task.
- The **Automa upstream source** referenced in the audit table lives at **`/root/automa/`** (a separate checkout), *not* under `/root/tuquet/`. Spot-checked 6/6 referenced files exist there.
- There is **no** `automation.enqueue_job`, **no** schedule-materializer function, **no** `pg_cron` usage, and **no** automation edge function yet.

## Source of truth and audit references

Use these files when you define, validate, or change the HRMS workflow. Do not infer a runtime parameter from a locale label alone.

### Tuquet workflow contract

| Concern | Reference | Use it for |
| --- | --- | --- |
| Workflow model | `cli/src/core/models/workflow.rs` | Rust serialization shape for workflows, nodes, edges, settings, tables. |
| Workflow schema | `cli/schema/workflow.schema.json` | JSON Schema for persisted workflow graphs. |
| Structural validation | `cli/src/core/engine/workflow_resolver/validator.rs` | Runtime acceptance rules for `nodes` and `drawflow`. |
| Compatibility normalization | `cli/src/core/engine/sanitizer.rs` | Legacy graph conversion and default edge handles. |
| Workflow fixture | `cli/fixtures/google_search.workflow.json` | Working example of the persisted graph format. |
| Job request types | `cli/src/api/handlers/jobs/types.rs` | `SubmitJobPayload`, runtime options, variables, browser selection. |
| Job endpoint (local only) | `cli/src/api/handlers/jobs/crud.rs` | Local daemon job API behavior (`POST /api/v1/jobs`). |
| Browser executor | `worker/src/drivers/cdp/workflow.rs` | Supported block labels, interpolation, branching, loops, cancellation, error handling. |
| Execution output | `worker/src/protocol/schema.rs` | Worker result, variables, tables, logs, artifacts. |
| **Cloud queue / claim** | `cloud/supabase/plugins/automation/install.sql` | `automation.jobs`, `claim_next_job`, `reap_stale_jobs`, `schedules`, notify trigger. |
| **Worker enrollment** | `cloud/supabase/plugins/workers/install.sql` | `workers.devices`, `enroll_device`, `heartbeat`. |

### Automa parameter audit (source checkout at `/root/automa/`)

| Concern | Reference | Use it for |
| --- | --- | --- |
| Block registry and defaults | `/root/automa/src/utils/shared.js` | Active block labels, UI defaults, categories, I/O counts, persisted data keys. |
| Workflow export shape | `/root/automa/src/utils/workflowData.js` | Exported workflow envelope, settings, table, global data. |
| Legacy conversion | `/root/automa/src/utils/convertWorkflowData.js` | Conversion from legacy Drawflow nodes/connections. |
| Workflow runtime | `/root/automa/src/workflowEngine/WorkflowEngine.js` | Trigger resolution, connection lookup, table access, execution state. |
| Block dispatch | `/root/automa/src/workflowEngine/WorkflowWorker.js` | Block data consumption, loops, fallbacks, runtime-only fields. |
| Workflow block handlers | `/root/automa/src/workflowEngine/blocksHandler` | Background block params (webhook, conditions, loops, JavaScript). |
| Browser content handlers | `/root/automa/src/content/blocksHandler` | Selector, form, extraction, event, scroll, upload, download params. |
| Selector resolution | `/root/automa/src/content/handleSelector.js` | `selector`, `findBy`, iframe/frame selector, multiple matches, wait behavior. |
| String interpolation | `/root/automa/src/workflowEngine/templating/renderString.js` | `variables`, `table`, `loopData`, `globalData`, `secrets`, expressions. |
| Template replacement | `/root/automa/src/workflowEngine/templating/mustacheReplacer.js` | Mustache and runtime value substitution. |
| Condition evaluation | `/root/automa/src/workflowEngine/utils/testConditions.js` | Comparison operators and condition value semantics. |
| UI labels only | `/root/automa/src/locales/en/blocks.json` | Display names/help text only. **Not** the persisted data schema. |

### Audit rules

1. Treat the Automa handlers as the behavioral source of truth. A field is part of the runtime contract only when a handler reads or writes it.
2. Use `shared.js` to identify active blocks and defaults, but do not make defaults mandatory in the workflow schema.
3. Keep block-specific data optional and allow extension fields for `block-package`, custom blocks, and forward compatibility.
4. Keep handler-only fields such as `activeTabId`, `refData`, `$frameRect`, `nextBlockId`, `prevBlockData` out of persisted input/output contracts.
5. Treat interpolation as runtime behavior for string fields. Never add secrets, JWTs, passwords, or auth headers to workflow variables.
6. When a schema change affects a block parameter, compare against the handler directory, `shared.js`, the fixture, and the CLI schema contract test.

## Scope

### In scope

- Define the HRMS workflow input and output contract.
- Create a reusable `hrms-timesheet-review` workflow template.
- Rewrite the HRMS API adapter (fetch-based, worker-compatible) from the snippets + mock tests.
- Run the workflow on an enrolled workstation in fleet mode.
- Add Cloud enqueue (`automation.enqueue_job`) + scheduler materialization (`automation.tick_schedules` on pg_cron) for `automation.schedules`.
- Add dry-run, submit, idempotency and audit behavior.
- Persist execution status (`automation.jobs`) and logs (`automation.execution_logs`).
- Keep HRMS credentials/tokens out of workflow payloads, job payloads and logs.

### Out of scope (first implementation)

- Running Chromium inside a Cloudflare Worker / Supabase scheduler.
- Replacing `tq auth login`.
- Building a new browser engine.
- Supporting multiple HRMS vendors.
- Auto-submitting before dry-run behavior is verified.
- Storing plaintext HRMS passwords anywhere.

## Target flow

```text
pg_cron (08:00 Asia/Ho_Chi_Minh, Mon–Fri)
  -> Edge Function (scheduled) calls automation.tick_schedules()
  -> tick_schedules scans due automation.schedules
     and INSERTs one automation.jobs row (status='queued') per
     tenant / workstation-profile / business date (idempotency key)
  -> notify_job_queued() -> pg_notify('automation_job_dispatch')
  -> enrolled workstation (tq worker start --cloud) sees the dispatch
  -> automation.claim_next_job(worker_id)  (FOR UPDATE SKIP LOCKED)
  -> Tuquet Automation executes the HRMS workflow
  -> CDP opens hrms-cmc profile, extracts session JWT
  -> HRMS REST API: scan + policy evaluation (dry-run | submit)
  -> worker reports to automation.execution_logs + job.result_summary
```

## Contracts

### Workflow job parameters (stored in `automation.jobs.parameters`)

```json
{
  "workflowId": "hrms-timesheet-review",
  "browserProfileId": "hrms-cmc",
  "mode": "dry-run",
  "businessDate": "2026-10-23",
  "variables": {
    "period": "current",
    "minLateMinutes": 1,
    "maxLateMinutes": 60,
    "excludeDates": []
  },
  "idempotencyKey": "hrms-timesheet-review:<tenant-id>:2026-10-23"
}
```

> `browserId` is injected into the workflow runtime options, not the HRMS payload. `mode` ∈ `dry-run | submit`; default `dry-run`.

### Cloud enqueue contract (new SQL helper)

```sql
-- New. Insert one queued job per (tenant, workflow, business date); idempotent.
CREATE OR REPLACE FUNCTION automation.enqueue_job(
    p_tenant_id      UUID,
    p_workflow_id    UUID,
    p_name           TEXT,
    p_parameters     JSONB,
    p_idempotency_key TEXT
) RETURNS automation.jobs;
```

Requirements:

- Insert with `status = 'queued'` (table default is `'pending'`; `claim_next_job` only selects `'queued'`).
- Enforce idempotency with a **dedicated column + partial unique index** (do not rely on `parameters` equality):
  ```sql
  ALTER TABLE automation.jobs ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
  CREATE UNIQUE INDEX IF NOT EXISTS uq_automation_jobs_idem
      ON automation.jobs (tenant_id, idempotency_key)
      WHERE idempotency_key IS NOT NULL;
  ```
  On duplicate, return the existing row (no second job).
- Existing claim path is unchanged: a worker in `workers.devices` with `status IN ('idle','running')` calls `automation.claim_next_job(worker_id)`.

### Scheduler contract (new SQL helper + pg_cron)

```sql
-- New. Materialize due schedules into jobs. Idempotent per business date.
CREATE OR REPLACE FUNCTION automation.tick_schedules()
RETURNS INT  -- number of jobs enqueued
LANGUAGE plpgsql SECURITY DEFINER AS $$ … $$;
```

- Select `automation.schedules WHERE is_active AND next_run_at <= now()`.
- For each, compute the Vietnam business date, build the idempotency key, call `automation.enqueue_job(...)`, then advance `last_run_at` / `next_run_at`.
- Schedule registration: `automation.schedules` row with `cron_expression = '0 8 * * 1-5'`, `timezone = 'Asia/Ho_Chi_Minh'`.
- Drive `tick_schedules()` from **pg_cron** (enable extension; `cron.schedule('hrms-tick', '*/5 * * * *', 'SELECT automation.tick_schedules();')`) and/or a scheduled Edge Function. The scheduler itself launches no browser and holds no HRMS secret.

### Job output (`automation.jobs.result_summary`)

```json
{
  "status": "succeeded",
  "mode": "dry-run",
  "period": "2026-10",
  "scannedDates": 23,
  "eligibleDates": [
    { "date": "2026-10-07", "minutes": 35, "reasonType": "LOA_CORP_4", "action": "would_submit" }
  ],
  "skippedDates": [],
  "submittedRequestIds": [],
  "warnings": []
}
```

## Implementation tasks

### Phase 1 — Extract the HRMS domain contract

- [ ] Define typed HRMS API request/response models.
- [ ] Rewrite `tools/hrms/src/api.js` logic as a **fetch-based** worker-compatible adapter (source snippets below are authoritative).
- [ ] Inject the token via an auth provider; never read `~/.hrms/config.json`.
- [ ] Typed errors: authentication, rate limiting, invalid period, API failure, duplicate request.
- [ ] Mock tests for employee detail, period, timesheet, submit responses.

**Acceptance:** adapter runs in Node and the target worker runtime; no password/JWT written to logs; API errors carry status + safe message; existing endpoint behavior preserved.

### Phase 2 — Define the Automation workflow

- [ ] Create workflow ID `hrms-timesheet-review`.
- [ ] Input variable validation (`period`, `mode`, `minLateMinutes`, `maxLateMinutes`, `excludeDates`).
- [ ] HRMS session check (CDP: profile has a live session?).
- [ ] Current period + timesheet retrieval (via adapter).
- [ ] Late/absent analysis using `absent_time` (never check-in lateness).
- [ ] Guards for the current unfinished workday (skip `date >= today`).
- [ ] Existing-request + excluded-date filters (`Pending`/`Approved` → skip).
- [ ] `dry-run` output branch.
- [ ] Explicit `submit` branch (policy-gated).
- [ ] Timeout + cancellation handling.

**Acceptance:** `tq automation inspect hrms-timesheet-review` validates; local run works with a test profile; dry-run performs no HRMS mutation; submit can be disabled by policy.

### Phase 3 — Workstation browser and worker execution

- [ ] Document workstation setup via `tq auth login`.
- [ ] Create the `hrms-cmc` browser profile and log in **once, manually**.
- [ ] Define how the HRMS session is established/reused (CDP reads the JWT from the profile).
- [ ] Ensure the worker runs in **fleet mode** (`tq worker start --cloud`) and claims via `claim_next_job`.
- [ ] Stream step logs to `automation.execution_logs` and the final result to `job.result_summary`.
- [ ] Verify profile isolation + session persistence.

**Acceptance:** enrolled workstation receives the job with no manual CLI interaction; runs against the selected profile; worker restart creates no duplicate submission; cancellation stops the active workflow safely.

### Phase 4 — Authentication and secret handling

- [ ] Keep Tuquet Cloud auth separate from HRMS auth.
- [ ] Cloud enrollment stays on `tq auth login`.
- [ ] HRMS auth = a logged-in browser profile only. **No stored password.**
- [ ] Read the JWT from the profile session (CDP) and pass it to the API adapter in memory only.
- [ ] Headless re-login is a manual recovery path only.
- [ ] Never include password/JWT/Authorization headers in job payloads, logs or audit records.
- [ ] Define token-expiry detection + re-auth behavior (fail safe with actionable message).

**Acceptance:** job payload holds no password/JWT; expired session → safe actionable failure; re-auth recorded without exposing the token.

### Phase 5 — Cloud scheduling and job creation

- [ ] Migration: add `automation.jobs.idempotency_key` + partial unique index.
- [ ] Add `automation.enqueue_job(...)` (idempotent).
- [ ] Add `automation.tick_schedules()`.
- [ ] Enable `pg_cron` + register the tick schedule (UTC-aware; VN 08:00 = 01:00 UTC).
- [ ] Add the scheduled Edge Function (thin wrapper calling `tick_schedules()`), if used.
- [ ] Seed one `automation.schedules` row: `cron_expression='0 8 * * 1-5'`, `timezone='Asia/Ho_Chi_Minh'`.
- [ ] Reject duplicate jobs by idempotency key.
- [ ] Allow `dry-run` / `submit` as separate policy-controlled modes.
- [ ] Retry rules for transient queue/API failures.

**Acceptance:** cron creates a job without running a browser; retry creates no duplicate submission; jobs visible in existing worker-queue/status APIs; schedule auditable by tenant + date.

### Phase 6 — Observability and safe rollout

- [ ] Metrics: queued / running / succeeded / failed.
- [ ] Error categories: auth, browser, HRMS API, policy.
- [ ] Audit record for every proposed/submitted date.
- [ ] Alert/visible failure when no eligible dates found unexpectedly.
- [ ] Run dry-run several full workdays.
- [ ] Enable submit only after owner approval.

**Acceptance:** every execution has a traceable job id + idempotency key; operators inspect the plan before submit; no duplicate request for the same employee/date/type; failure + retry documented.

## Recommended first slice

Implement **only** this vertical slice first (unaffected by the cloud-scheduling work):

1. `tq auth login` workstation already works.
2. Add `hrms-timesheet-review` as a **dry-run** workflow.
3. Execute it **locally** on the enrolled workstation + `hrms-cmc` profile.
4. Return a structured plan with eligible/skipped dates.
5. Do not submit requests yet.
6. Do not add the Cloud scheduler until the local worker job is proven.

## Verification commands

> Confirm exact flags against `tq <cmd> --help` before relying on them — the CLI contract may differ from these examples.

```powershell
# Workstation authentication
tq auth login

# Browser + worker readiness
tq browser profile list            # verify --format flag for JSON
tq worker status                   # local daemon status

# Workflow validation + local execution
tq automation inspect hrms-timesheet-review
# NOTE: `tq automation run` takes a WORKFLOW FILE path as its first positional
# arg, not a stored workflow id. Confirm the flag that runs a STORED workflow by id
# (e.g. --workflow / the interactive picker) before use.
tq automation run <path-to>.workflow.json --headless --timeout 300

# Cloud job verification (after Phase 5)
tq worker logs -f
tq worker start --cloud            # fleet mode: claim from automation.jobs
```

## Security requirements

- Never commit HRMS credentials, JWTs, cookies, browser profiles or local `.hrms` files.
- Never log Authorization headers or credential-bearing request bodies.
- Do not place secrets in workflow variables.
- Use idempotency before every mutating HRMS request.
- Require explicit policy approval before enabling submit mode.
- Keep dry-run as the default mode.

## Open items

1. ~~**First target**~~ — **RESOLVED**: admin tenant `e0f30395-…`, workstation `HNDW-NDTU6`, profile `hrms-cmc`. First login into `hrms-cmc` is still a manual step.
2. **`reason_type` mapping** — confirm default `LOA_CORP_4` and whether others are needed.
3. **`idempotency_key` column** — approve the schema change on `automation.jobs`.
4. **Exact stored-workflow run flag** — confirm the CLI invocation for running by id (see Verification commands).
5. **Alert channel** — where the "no eligible dates unexpectedly" alert should fire.

## Reference code (rewrite from these — `tools/hrms` no longer exists)

Preserve behavior while moving the code behind typed Tuquet interfaces. Do not copy local filesystem/config persistence into a Worker.

### HRMS API adapter source (`tools/hrms/src/api.js`)

```js
export async function apiFetch(endpoint, options = {}, token) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const headers = {
    Accept: '*/*',
    'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
    Authorization: `Bearer ${token}`,
    Origin: HRMS_WEB_URL,
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  const text = await response.text();

  try {
    return { ok: response.ok, status: response.status, data: JSON.parse(text) };
  } catch {
    return { ok: response.ok, status: response.status, rawText: text };
  }
}

export async function getUserDetail(username, token) {
  return apiFetch(`/user/detail?username=${encodeURIComponent(username)}`, {}, token);
}

export async function getCurrentPeriod(token) {
  const response = await apiFetch('/filters/periods', {}, token);
  if (!response.ok || !Array.isArray(response.data?.data)) {
    throw new Error('Unable to load HRMS periods');
  }
  return response.data.data.find((period) => period.is_current_timesheet) ?? response.data.data[0];
}

export async function getFlexibleTimesheet(timesheetId, employeeId, token) {
  return apiFetch(`/timesheets/flexible/${timesheetId}/employee/${employeeId}`, {}, token);
}

export async function submitLateRequest({ employeeId, dates, description, reasonType, token }) {
  const payload = {
    request_type: 'TIME_OFF',
    reason_type: reasonType ?? 'LOA_CORP_4',
    description,
    mail_cc: [],
    employee: employeeId,
    request_dates: dates,
    time_leave: null,
  };

  const response = await apiFetch(
    '/request-management/create-common-request',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    token
  );

  return { payload, response };
}
```

Constants (`tools/hrms/src/constants.js`):

```js
const HRMS_WEB_URL = 'https://hrms.cmcglobal.com.vn';
const BASE_URL = 'https://hrms-be.cmcglobal.com.vn/api/tms';
```

The adapter must inject the token through an auth provider. It must not read `~/.hrms/config.json` inside a Worker.

### HRMS analysis logic source (`tools/hrms/src/timesheet.js`)

```js
const today = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Ho_Chi_Minh',
}).format(new Date());

for (const item of timesheets) {
  if (!item.check_in_time) continue;

  const [date] = item.date_of_issue.split(' ');
  const absentMinutes = Number(item.absent_time ?? 0);
  const existingRequests = item.request_detail ?? [];
  const hasPendingOrApproved = existingRequests.some(
    (request) => request.status_type === 'Pending' || request.status_type === 'Approved'
  );

  // Today and future dates are never auto-submitted.
  if (date >= today) {
    continue;
  }

  if (absentMinutes <= 0 || hasPendingOrApproved) {
    continue;
  }

  if (excludeDates.has(date)) continue;
  if (minMinutes !== null && absentMinutes < minMinutes) continue;
  if (maxMinutes !== null && absentMinutes > maxMinutes) continue;

  eligibleDates.push({
    date,
    minutes: absentMinutes,
    existingRequests,
  });
}
```

Do not replace `absent_time` with check-in lateness. The HRMS server value is the authoritative total missing time after the workday is closed.

### Headless login reference (`tools/hrms/src/browser.js`) — recovery path only

```js
page.on('request', (request) => {
  const authorization = request.headers().authorization;
  if (authorization?.startsWith('Bearer ') && !capturedToken) {
    capturedToken = authorization.slice('Bearer '.length).trim();
  }
});

page.on('response', async (response) => {
  if (!response.url().includes('/auth/login')) return;

  const json = await response.json().catch(() => null);
  capturedToken = json?.token ?? json?.access_token ?? capturedToken;
});

const storageToken = await page.evaluate(() =>
  ['token', 'accessToken', 'jwt', 'auth_token', 'access_token']
    .map((key) => localStorage.getItem(key))
    .find(Boolean)
);
```

For the first Tuquet implementation, prefer the existing authenticated profile. Use headless login only as an explicit recovery step on the workstation. Never place the password in a Cloud job payload.

### Local daemon job contract (`cli/src/api/handlers/jobs/types.rs`, `crud.rs`) — for local runs only

`POST /api/v1/jobs` on the **local** daemon (`127.0.0.1:8765`):

```json
{
  "workflowId": "hrms-timesheet-review",
  "options": {
    "variables": {
      "period": "current",
      "mode": "dry-run",
      "minLateMinutes": 1,
      "maxLateMinutes": 60,
      "excludeDates": [],
      "idempotencyKey": "hrms-timesheet-review:tenant-123:2026-10-23"
    },
    "browserId": "hrms-cmc",
    "headless": true,
    "debug": false,
    "closeBrowserOnFinish": false
  }
}
```

Rust payload types:

```rust
pub struct SubmitJobPayload {
    pub workflow_id: Option<String>,
    pub workflow_path: Option<String>,
    pub workflow_data: Option<serde_json::Value>,
    pub options: Option<SubmitJobOptions>,
}

pub struct SubmitJobOptions {
    pub variables: Option<serde_json::Value>,
    pub browser_id: Option<String>,
    pub default_browser: Option<String>,
    pub headless: Option<bool>,
    pub debug: Option<bool>,
    pub close_browser_on_finish: Option<bool>,
}
```

Response:

```json
{ "jobId": "job_123abc", "status": "queued", "message": null }
```

> Cloud paths use `automation.jobs` + `claim_next_job`, **not** this local endpoint.
