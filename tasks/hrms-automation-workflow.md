# Task: HRMS Automation Workflow on Tuquet

## Status

- Draft for review
- Do not implement or push until the owner approves this task

## Objective

Turn the existing HRMS CLI workflow into a Tuquet Automation workflow executed by an enrolled workstation.

The Cloud scheduler creates a Tuquet job. A workstation authenticated with `tq auth login` receives the job, runs the workflow through the native automation and browser engines, and reports status and logs to Cloud.

Cloud Cron must not run the HRMS Node CLI directly and must not depend on a native Chromium process.

## Existing Building Blocks

- `tools/hrms`: working Node.js HRMS client
- HRMS API client for employee detail, current period, timesheet and `TIME_OFF` submission
- Playwright headless login flow that captures and stores an HRMS JWT
- `tq auth login`: Cloud operator authentication and workstation enrollment
- `tq worker`: job polling, execution, cancellation and telemetry
- `tq automation`: workflow storage and execution
- `tq browser`: isolated browser profiles, cookies, local storage and CDP
- Supabase job API and Cloud Cron infrastructure

## Source of truth and audit references

Use these files when you define, validate, or change the HRMS workflow. Do not infer a runtime parameter from a locale label alone.

### Tuquet workflow contract

| Concern | Reference | Use it for |
| --- | --- | --- |
| Workflow model | [cli/src/core/models/workflow.rs](../cli/src/core/models/workflow.rs) | Rust serialization shape for workflows, nodes, edges, settings, and tables. |
| Workflow schema | [cli/schema/workflow.schema.json](../cli/schema/workflow.schema.json) | JSON Schema for persisted Tuquet and Automa-compatible workflow graphs. |
| Structural validation | [cli/src/core/engine/workflow_resolver/validator.rs](../cli/src/core/engine/workflow_resolver/validator.rs) | Runtime acceptance rules for `nodes` and `drawflow`. |
| Compatibility normalization | [cli/src/core/engine/sanitizer.rs](../cli/src/core/engine/sanitizer.rs) | Legacy graph conversion and default edge handles. |
| Workflow fixture | [cli/fixtures/google_search.workflow.json](../cli/fixtures/google_search.workflow.json) | A working example of the persisted graph format. |
| Job request types | [cli/src/api/handlers/jobs/types.rs](../cli/src/api/handlers/jobs/types.rs) | `SubmitJobPayload`, runtime options, variables, and browser selection. |
| Job endpoint | [cli/src/api/handlers/jobs/crud.rs](../cli/src/api/handlers/jobs/crud.rs) | Job creation behavior and response contract. |
| Browser executor | [worker/src/drivers/cdp/workflow.rs](../worker/src/drivers/cdp/workflow.rs) | Supported block labels, interpolation, branching, loops, cancellation, and error handling. |
| Execution output | [worker/src/protocol/schema.rs](../worker/src/protocol/schema.rs) | Worker result, variables, tables, logs, and artifacts. |

### Automa parameter audit

| Concern | Reference | Use it for |
| --- | --- | --- |
| Block registry and defaults | [automa/src/utils/shared.js](../automa/src/utils/shared.js) | Active block labels, UI defaults, block categories, input/output counts, and persisted data keys. |
| Workflow export shape | [automa/src/utils/workflowData.js](../automa/src/utils/workflowData.js) | Exported workflow envelope, settings, table, global data, and included workflows. |
| Legacy conversion | [automa/src/utils/convertWorkflowData.js](../automa/src/utils/convertWorkflowData.js) | Conversion from legacy Drawflow nodes and connections. |
| Workflow runtime | [automa/src/workflowEngine/WorkflowEngine.js](../automa/src/workflowEngine/WorkflowEngine.js) | Trigger resolution, connection lookup, table access, and workflow execution state. |
| Block dispatch | [automa/src/workflowEngine/WorkflowWorker.js](../automa/src/workflowEngine/WorkflowWorker.js) | Block data consumption, loops, fallback paths, breakpoints, and runtime-only fields. |
| Workflow block handlers | [automa/src/workflowEngine/blocksHandler](../automa/src/workflowEngine/blocksHandler) | Background block parameters such as webhook, conditions, loops, JavaScript, and workflow control. |
| Browser content handlers | [automa/src/content/blocksHandler](../automa/src/content/blocksHandler) | Selector, form, extraction, event, scroll, upload, download, and DOM interaction parameters. |
| Selector resolution | [automa/src/content/handleSelector.js](../automa/src/content/handleSelector.js) | `selector`, `findBy`, iframe/frame selector, multiple matches, and wait behavior. |
| String interpolation | [automa/src/workflowEngine/templating/renderString.js](../automa/src/workflowEngine/templating/renderString.js) | `variables`, `table`, `loopData`, `globalData`, `secrets`, and expression replacement. |
| Template replacement | [automa/src/workflowEngine/templating/mustacheReplacer.js](../automa/src/workflowEngine/templating/mustacheReplacer.js) | Mustache and runtime value substitution rules. |
| Condition evaluation | [automa/src/workflowEngine/utils/testConditions.js](../automa/src/workflowEngine/utils/testConditions.js) | Comparison operators and condition value semantics. |
| UI labels only | [automa/src/locales/en/blocks.json](../automa/src/locales/en/blocks.json) | Display names, help text, labels, and option captions. Do not treat it as the persisted data schema. |

### Audit rules

1. Treat the Automa handlers as the behavioral source of truth. A field is part of the runtime contract only when a handler reads or writes it.
2. Use `shared.js` to identify active blocks and defaults, but do not make defaults mandatory in the workflow schema.
3. Keep block-specific data optional and allow extension fields for `block-package`, custom blocks, and forward compatibility.
4. Keep handler-only fields such as `activeTabId`, `refData`, `$frameRect`, `nextBlockId`, and `prevBlockData` out of persisted workflow input and output contracts.
5. Treat interpolation as runtime behavior for string fields. Do not add secrets, JWTs, passwords, or authorization headers to workflow variables.
6. When a schema change affects a block parameter, compare the change against the handler directory, `shared.js`, the fixture, and the CLI schema contract test.

## Scope

### In scope

- Define the HRMS workflow input and output contract
- Create a reusable HRMS workflow template
- Run the workflow on an enrolled Tuquet workstation
- Add Cloud job creation for scheduled HRMS runs
- Add dry-run, submit, idempotency and audit behavior
- Persist execution status and logs
- Keep HRMS credentials and tokens out of workflow payloads and logs

### Out of scope for the first implementation

- Running Chromium directly inside a Cloudflare Worker Cron
- Replacing `tq auth login`
- Building a new browser engine
- Supporting multiple HRMS vendors
- Automatically submitting requests before dry-run behavior is verified
- Storing plaintext HRMS passwords in Supabase tables

## Target Flow

```text
Cloud Cron Trigger
  -> create idempotent HRMS workflow job
  -> Supabase job queue
  -> enrolled workstation worker polls and claims job
  -> Tuquet Automation executes HRMS workflow
  -> browser profile opens HRMS through CDP
  -> scan and policy evaluation
  -> dry-run or submit
  -> worker reports logs, result and audit data
```

## Workflow Contract

### Job input

```json
{
  "workflowId": "hrms-timesheet-review",
  "browserProfileId": "hrms-cmc",
  "mode": "dry-run",
  "variables": {
    "period": "current",
    "minLateMinutes": 1,
    "maxLateMinutes": 60,
    "excludeDates": []
  },
  "idempotencyKey": "hrms-timesheet-review:<tenant-id>:<yyyy-mm-dd>"
}
```

### Job output

```json
{
  "status": "succeeded",
  "mode": "dry-run",
  "period": "2026-10",
  "scannedDates": 23,
  "eligibleDates": [
    {
      "date": "2026-10-07",
      "minutes": 35,
      "reasonType": "LOA_CORP_4",
      "action": "would_submit"
    }
  ],
  "skippedDates": [],
  "submittedRequestIds": [],
  "warnings": []
}
```

## Implementation Tasks

### Phase 1: Extract the HRMS domain contract

- [ ] Define typed HRMS API request and response models
- [ ] Port the existing HRMS API calls from `tools/hrms/src/api.js` to a worker-compatible adapter
- [ ] Keep the adapter based on `fetch`; do not depend on Node filesystem APIs
- [ ] Define typed errors for authentication, rate limiting, invalid period, API failure and duplicate request
- [ ] Add mock tests for employee detail, period, timesheet and submit responses

Acceptance criteria:

- The adapter can run in Node and the intended Worker runtime
- No password or JWT is written to logs
- API errors include status and a safe message
- Existing HRMS endpoint behavior is preserved

### Phase 2: Define the Automation workflow

- [ ] Create workflow ID `hrms-timesheet-review`
- [ ] Add input variable validation
- [ ] Add HRMS session check
- [ ] Add current period and timesheet retrieval
- [ ] Add late and absent time analysis
- [ ] Add guards for current unfinished workday
- [ ] Add existing-request and excluded-date filters
- [ ] Add `dry-run` output
- [ ] Add explicit `submit` branch
- [ ] Add timeout and cancellation handling

Acceptance criteria:

- `tq automation inspect` validates the workflow
- `tq automation run hrms-timesheet-review --headless` works locally with a test profile
- Dry-run performs no HRMS mutation
- Submit mode can be disabled by policy

### Phase 3: Workstation browser and worker execution

- [ ] Document workstation setup with `tq auth login`
- [ ] Create or import the `hrms-cmc` browser profile
- [ ] Define how the HRMS session is established and reused
- [ ] Use the native Tuquet CDP/browser engine for execution
- [ ] Ensure the worker can claim, execute, cancel and finish the job
- [ ] Stream step logs and final result to Cloud
- [ ] Verify browser profile isolation and session persistence

Acceptance criteria:

- An enrolled workstation receives the HRMS job without manual CLI interaction
- The workflow runs against the selected browser profile
- Worker restart does not create duplicate submissions
- Cancellation stops the active workflow safely

### Phase 4: Authentication and secret handling

- [ ] Keep Tuquet Cloud auth separate from HRMS auth
- [ ] Store Cloud enrollment through the existing `tq auth login` flow
- [ ] Store HRMS credentials in an approved secret store or workstation secret provider
- [ ] Reuse the HRMS browser session whenever possible
- [ ] Add headless browser login only as an auth recovery path
- [ ] Never include password, JWT or Authorization headers in job payloads, logs or audit records
- [ ] Define token expiry and re-authentication behavior

Acceptance criteria:

- A job payload contains no HRMS password or JWT
- Expired HRMS sessions produce a safe, actionable failure
- Successful re-authentication is recorded without exposing the token

### Phase 5: Cloud scheduling and job creation

- [ ] Add an idempotent HRMS schedule configuration
- [ ] Add Cloud Cron handler for the schedule
- [ ] Convert Vietnam business time to UTC explicitly
- [ ] Create one job per tenant, workstation/profile and business date
- [ ] Reject duplicate jobs using the idempotency key
- [ ] Allow `dry-run` and `submit` as separate policy-controlled modes
- [ ] Add retry rules for transient queue/API failures

Acceptance criteria:

- Cron creates a job without running a browser
- A retry does not create duplicate HRMS submissions
- Jobs are visible in the existing worker queue/status APIs
- Schedule execution is auditable by tenant and date

### Phase 6: Observability and safe rollout

- [ ] Add execution metrics for queued, running, succeeded and failed jobs
- [ ] Add safe error categories for auth, browser, HRMS API and policy failures
- [ ] Add an audit record for every proposed or submitted date
- [ ] Add an alert or visible failure state when no eligible dates are found unexpectedly
- [ ] Run dry-run mode for several complete workdays
- [ ] Enable submit mode only after owner approval

Acceptance criteria:

- Every execution has a traceable job ID and idempotency key
- Operators can inspect the plan before enabling submit mode
- No duplicate request is submitted for the same employee/date/type
- Failure and retry behavior is documented

## Recommended First Slice

Implement only this vertical slice first:

1. `tq auth login` workstation is already working
2. Add `hrms-timesheet-review` as a dry-run workflow
3. Execute it locally on an enrolled workstation and browser profile
4. Return a structured plan with eligible and skipped dates
5. Do not submit requests yet
6. Do not add Cloud Cron until the local worker job is proven

## Verification Commands

```powershell
# Workstation authentication
 tq auth login

# Browser and worker readiness
 tq browser profile list
 tq worker status --json

# Workflow validation and local execution
 tq automation inspect hrms-timesheet-review
 tq automation run hrms-timesheet-review --headless --timeout 300

# Cloud job verification after Phase 5
 tq worker logs -f
 tq worker status --json
```

Replace the command examples with the exact current CLI syntax if the command contract differs.

## Security Requirements

- Never commit HRMS credentials, JWTs, cookies, browser profiles or local `.hrms` files
- Never log Authorization headers or request bodies containing credentials
- Do not place secrets in workflow variables
- Use idempotency before every mutating HRMS request
- Require explicit policy approval before enabling submit mode
- Keep dry-run as the default mode

## Reference Code From Existing Repositories

These snippets are copied from the current implementation. Agents should preserve the behavior while moving the code behind typed Tuquet interfaces. Do not copy local filesystem/config persistence into a Cloudflare Worker.

### HRMS API adapter source

Reference: `tools/hrms/src/api.js`.

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

Current HRMS endpoints are defined in `tools/hrms/src/constants.js`:

```js
const HRMS_WEB_URL = 'https://hrms.cmcglobal.com.vn';
const BASE_URL = 'https://hrms-be.cmcglobal.com.vn/api/tms';
```

The new adapter must inject the token through an auth provider. It must not read `~/.hrms/config.json` inside a Worker.

### HRMS analysis logic source

Reference: `tools/hrms/src/timesheet.js`.

The important business rules are:

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

### Headless login reference

Reference: `tools/hrms/src/browser.js`.

The current local implementation captures a token from request headers, auth responses or local storage:

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

For the first Tuquet implementation, prefer an existing authenticated browser profile. Use headless login only as an explicit recovery step on the workstation. Do not place the password in the Cloud job payload.

### Actual Tuquet job submission contract

Reference: `cli/src/api/handlers/jobs/types.rs` and `cli/src/api/handlers/jobs/crud.rs`.

The current endpoint is:

```text
POST /api/v1/jobs
```

The request shape is:

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

The existing Rust payload types are:

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

The existing response is:

```json
{
  "jobId": "job_123abc",
  "status": "queued",
  "message": null
}
```

Cloud Cron should call this contract, not invent a second HRMS-specific queue format. Add idempotency handling either to the job service or as a separate database uniqueness constraint before enqueueing.

### Cloud Cron job creation pseudocode

```ts
export default {
  async scheduled(event, env, ctx) {
    const businessDate = formatVietnamDate(new Date(event.scheduledTime));
    const idempotencyKey = `hrms-timesheet-review:${env.TENANT_ID}:${businessDate}`;

    const response = await fetch(`${env.TUQUET_API_URL}/api/v1/jobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.TUQUET_SERVICE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId: 'hrms-timesheet-review',
        options: {
          browserId: env.HRMS_BROWSER_PROFILE_ID,
          headless: true,
          closeBrowserOnFinish: false,
          variables: {
            period: 'current',
            mode: 'dry-run',
            businessDate,
            minLateMinutes: 1,
            maxLateMinutes: 60,
            excludeDates: [],
            idempotencyKey,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Unable to enqueue HRMS job: ${response.status}`);
    }
  },
};
```

The cron handler never receives or stores an HRMS password/JWT. The workstation browser profile owns the HRMS session.

### Workstation execution pseudocode

```rust
pub async fn execute_hrms_job(
    job: Job,
    browser_profile: &str,
    variables: &serde_json::Value,
) -> Result<JobResult, WorkerError> {
    let mode = variables
        .get("mode")
        .and_then(|value| value.as_str())
        .unwrap_or("dry-run");

    let result = automation_engine
        .run_workflow(
            "hrms-timesheet-review",
            browser_profile,
            variables,
        )
        .await?;

    if mode == "submit" && !result.policy_allows_submit {
        return Err(WorkerError::PolicyDenied("submit mode is disabled".into()));
    }

    Ok(result.into_job_result(job.id))
}
```

This should use the existing worker job lifecycle and log endpoints. Do not create a second long-running HRMS daemon.

## Review Questions

1. Should the first workflow use the HRMS website through CDP, the HRMS API directly, or a hybrid of both?
2. Where should workstation HRMS credentials live: local secret store, encrypted Tuquet profile, or another approved provider?
3. Should the first Cloud Cron run only dry-run, or should it be able to submit after a manual approval?
4. What is the desired Vietnam-time schedule and cutoff rule for the current workday?
5. Which tenant/workstation/browser profile should receive the first production-like job?
6. What is the exact existing job creation endpoint and payload contract to use for Phase 5?
