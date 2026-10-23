# Kế hoạch: HRMS Automation Workflow trên Tuquet

> Nguồn: [`hrms-automation-workflow.md`](./hrms-automation-workflow.md) — task gốc đã audit & chốt thiết kế.
> Trạng thái tổng: **Dry-run đã chạy thật end-to-end trên engine local** (xem §8). Còn lại: dispatch cloud + chuyển secret sang store mã hoá.

## 1. Trạng thái

| Thuộc tính | Giá trị |
| --- | --- |
| Độ ưu tiên | P1 (tự động hoá nghiệp vụ HRMS, chạy trên workstation đã enroll) |
| Category | feature / automation |
| Effort dự kiến | 6 phase, ~6–9 ngày công |
| Depends on | `tq auth login` (đã có) · tenant admin `e0f30395-…` · workstation `HNDW-NDTU6` · **engine antidetect + profile `hrms-cmc`** |
| Risk | Trung bình–cao (ghi dữ liệu thật lên HRMS; phụ thuộc session antidetect + lease) |
| Gate an toàn | Dry-run mặc định; **submit chỉ bật sau khi owner duyệt** |

## 2. Vì sao

Chuyển luồng HRMS thủ công (đọc timesheet → phát hiện ngày thiếu giờ → gửi đơn `TIME_OFF`) thành workflow Automation của Tuquet, chạy tự động bởi workstation đã enroll. Cloud chỉ điều phối qua queue; **không** chạy Node CLI hay Chromium trong scheduler.

## 3. Hiện trạng (đã xác minh trên code + cloud + live API)

### 3.1 Hạ tầng tái sử dụng được (verified)

| Hạng mục | Vị trí | Ghi chú |
| --- | --- | --- |
| Job queue + claim | `cloud/supabase/plugins/automation/install.sql` | `automation.jobs`, `claim_next_job` (SKIP LOCKED), `reap_stale_jobs`, `notify_job_queued` |
| Schedules | `automation.schedules` | có `cron_expression` + `timezone` + `next_run_at`; **nhưng chưa có gì materialize** |
| Worker enrollment | `cloud/supabase/plugins/workers/install.sql` | `workers.devices`, `enroll_device`, `heartbeat` |
| **Antidetect browser** | `cloud/supabase/plugins/browsers/install.sql` | `browsers.profiles`, `browsers.fingerprint_templates`, `browsers.releases`, `acquire/release_profile` |
| Worker fleet transport | `worker/src/transport/ws_client.rs` | WS outbound; **nhận `DispatchJob` (push) — KHÔNG poll `automation.jobs`** |
| CLI subcommands | `tq auth login` · `tq worker start/status/logs` · `tq automation run/inspect` · `tq browser *` | tất cả tồn tại |
| Block engine | `worker/src/drivers/cdp/workflow.rs` | label: `trigger, delay, new-tab, javascript-code, webhook, conditions/while-loop, loop-data, insert-data, get-text, attribute-value, …`; interpolate `{{variables.x}}`; edge handle `{id}-output-{branch}` |
| Payload contract | `cli/src/api/handlers/jobs/types.rs` | `SubmitJobPayload`/`SubmitJobOptions` (local) |
| Automa source | `/root/automa/` (checkout riêng) | 6/6 file audit spot-check tồn tại |

### 3.2 Workflow trên cloud + đã chạy thật

- `automation.workflows` → **`HRMS Timesheet Review`**, id `a27093ce-a768-4e3a-bcc1-e4d87da6157c`, tenant admin, `status=draft`.
- Graph hiện tại: **12 nodes / 11 edges** (schema-valid): `trigger → new-tab(/login) → javascript-code(login fill+click) → delay → javascript-code(đọc token) → conditions(session guard) → javascript-code(analyze) → conditions(mode==submit) → javascript-code(submit) → done-*`.
- **Đã chạy thật trên engine local**: dry-run 9 bước, `workflow_finished`, **không mutate HRMS**; plan thật: 28 ngày quét · 0 eligible · 17 `no_absence` · 3 `existing_request` · 1 `today_or_future`.

### 3.3 Khoảng trống đã phát hiện lúc audit (đã xử lý bằng quyết định)

1. `tools/hrms` **không còn tồn tại** → viết lại adapter từ snippet trong task.
2. Mâu thuẫn dispatch: pseudocode cũ `POST /api/v1/jobs` là **localhost-only** → chuyển sang `automation.jobs`.
3. Không có `pg_cron`/edge fn materialize schedule → phải thêm.
4. Lệnh verify `tq automation run <id>` **sai** (positional là đường dẫn file).
5. **Worker KHÔNG claim từ `automation.jobs`** — `grep claim_next_job` toàn workspace = **0 caller**; queue hiện là **bảng chết**.
6. **Không có control-plane nào gửi `DispatchJob`** — server push **chưa tồn tại**.
7. **Chưa cài `tq` trên VPS, chưa có worker daemon chạy** — thiết bị enroll `HNDW-NDTU6` là **máy Windows**.
8. **Engine KHÔNG seed `variables` của file workflow** — chỉ job payload (`-p` / `automation.jobs.parameters`) mới seed (xem §3.4). Default phải để ở job params hoặc fallback trong code.
9. **Login HRMS payload được mã hoá client-side (RSA)** — không login được bằng REST thô (xem §3.4).

### 3.4 HRMS API contract (verified trên live API, 2026-10-23)

| Hạng mục | Giá trị (đã xác minh) |
| --- | --- |
| Web origin | `https://hrms.cmcglobal.com.vn` — SPA Vue/ant-design ("Human Resource Management System") |
| **Login** | `POST https://hrms-be.cmcglobal.com.vn/login`, body `{username, password}` **đã RSA-encrypt client-side** (`jsencrypt`, PKCS1 v1.5, public key nhúng trong bundle) → trả `{access_token, userName}` |
| Session | `localStorage.session_login = JSON({access_token, userName})`; mọi call data gắn `Authorization: Bearer <access_token>` |
| Data API base | `https://hrms-be.cmcglobal.com.vn/api/tms` |
| User detail | `GET /user/detail?username=<u>` → **`data.userId`** (employeeId), `data.userName`, `data.displayName`, `permissions[]` |
| Periods | `GET /filters/periods` → `data[]`; phần tử có **`timesheet_id`**, `is_current_timesheet`, `from_date`, `to_date` |
| Timesheet | `GET /timesheets/flexible/<timesheet_id>/employee/<employeeId>` → **`data.timesheets[]`** (mảng theo ngày) |
| Submit | `POST /request-management/create-common-request` body `{request_type:'TIME_OFF', reason_type:'LOA_CORP_4', description, mail_cc:[], employee, request_dates:[...], time_leave:null}` |
| Row shape | `date_of_issue` (`YYYY-MM-DD HH:MM:SS`), `check_in_time`, **`absent_time`** (phút), `request_detail[]` (`status_type` Pending/Approved), `is_late_coming`, `is_holiday` |

**Bug logic đã phát hiện & vá trong `analyze`:** `employeeId = data.userId` (không phải `data.data.id`); period id = `timesheet_id` (không phải `id`); rows = `data.timesheets` (không phải `data.data`).
**Structural:** login phải tách `javascript-code(fill+click)` → block `delay` → `javascript-code(đọc token)`; poll >10s trong **1 evaluate vượt timeout CDP** → `job_failed`.

## 4. Entity: Browser anti-detect (trọng tâm)

HRMS yêu cầu một **danh tính trình duyệt ổn định, tách biệt và chống phát hiện** để giữ session đăng nhập bền vững.

### 4.1 Engine (fingerprint-chromium)

- Engine nền: **`adryfish/fingerprint-chromium`** (`browser_type='ungoogled-chromium'`, `engine_version='148.0.7778.215'`).
- Fingerprint áp ở tầng **C++ engine** (Canvas 2D noise, WebGL params, AudioContext DSP, font metrics, `Math.random` PRNG) — **không** dùng extension shim JS.
- Catalog release tải từ `browsers.releases` (Supabase / GitHub), verify SHA-256 → provision qua `tq browser install`.

### 4.2 Profile entity — `browsers.profiles`

| Nhóm | Trường | Ý nghĩa |
| --- | --- | --- |
| Định danh | `id`, `tenant_id`, `name`, `group_name`, `tags` | `hrms-cmc` thuộc tenant admin |
| Fingerprint lõi | **`fingerprint_seed`** (BIGINT) | Một seed duy nhất, tất định, chi phối Canvas/WebGL/Audio/font/PRNG |
| Nền tảng | `os_platform`, `os_version`, `browser_brand`, `cpu_cores`, `ram_gb` | spoof phần cứng |
| Hiển thị | `screen_width`, `screen_height`, `device_pixel_ratio` | hình học + HiDPI |
| Ngôn ngữ & headers | `timezone`, `locale`, `accept_languages`, `user_agent`, `sec_ch_ua*` | khớp `Asia/Ho_Chi_Minh` + `vi-VN` |
| Mạng | `proxy_id`, `custom_proxy`, `change_ip_url`, `auto_timezone`, `auto_locale`, **`webrtc_mode='proxy_shielded'`** | chống rò IP qua WebRTC STUN |
| Snapshot phiên | `storage_path`, `storage_size_bytes`, `storage_hash`, `cookies_count`, `last_synced_at` | đồng bộ `localStorage`/cookie/JWT |
| **Lease** | `status` (idle/running/syncing/error), **`locked_by_device_id`**, `locked_at`, `last_launched_at` | khóa độc quyền 1 thiết bị |
| Khởi động | `startup_flags`, `extensions`, `metadata` | stealth default = `[]` |

- Sandbox local: `~/.tq/browser/profiles/<profile_id>/` (`profile.json` + `Default/` + `extensions/`).

### 4.3 Lease độc quyền (bắt buộc cho HRMS)

- RPC: `browsers.acquire_profile` / `browsers.release_profile` / `browsers.reap_stale_profile_locks` (public: `acquire_browser_profile`, …).
- CLI: `tq browser profile cloud acquire <id>` / `release <id>`.
- Bảo đảm **chỉ MỘT workstation dùng `hrms-cmc` một lúc** → không có hai phiên HRMS song song.
- Stale lock dọn tự động (`reap_stale_profile_locks`, default 10 phút).

### 4.4 Đồng bộ snapshot phiên (session reuse)

- `pack` → `.tar.zst` (lọc cache, < ~15 MB); `unpack` khôi phục; `push`/`pull` qua bucket `browser-profiles`.
- `tq automation run --cloud-profile <id>`: **acquire lease → unpack → verify proxy → execute → pack delta → release lease**.
- `tq browser profile verify` = CreepJS stealth check.

### 4.5 Áp vào HRMS

- Profile **`hrms-cmc`**: `os=windows`, `timezone=Asia/Ho_Chi_Minh`, `locale=vi-VN`, `webrtc_mode=proxy_shielded`.
- Workflow dùng profile qua `browserId` (job `options`) hoặc `--cloud-profile`.
- Liên kết local ↔ cloud: `profile.json.cloud_id`.
- **Bảo mật:** snapshot chứa cookie/JWT → **không commit, không log, không payload**.

## 5. Credential storage — Automa pattern → thiết kế Tuquet

### 5.1 Automa làm thế nào (đọc tại `/root/automa`)

| Khía cạnh | Cách Automa làm |
| --- | --- |
| Nơi lưu | IndexedDB table `credentials: '++id, &name'` — record `{id, name (unique), value, createdAt}` (`db/storage.js`, `StorageCredentials.vue`) |
| Mã hoá | `value = HMAC_SHA256(cipher, SHA256(pass)) (64 hex) + AES_encrypt(value, pass)` (crypto-js) — `utils/credentialUtil.js` |
| Key | `pass = getPassKey('credential')` — hàm ở file **`src/utils/getPassKey.js` (gitignored, build-time secret)**, KHÔNG nằm trong DB |
| Tham chiếu | Workflow **không chứa secret** — chỉ giữ `{{ secrets@name }}` (editor regex `/\{\{\s*secrets@(.*?)\}\}/`); engine map `secrets@`→`secrets.` |
| Lúc chạy | `WorkflowEngine` nạp `credentials` → `referenceData.secrets[name] = value`; decrypt khi interpolate (`templating/mustacheReplacer.js` → `credentialUtil.decrypt`) |
| **Scrub** | `blocksHandler/handlerJavascriptCode.js` truyền `refData = {...newRefData, secrets: {}}` → **JS trong page KHÔNG nhận secrets** |
| Dùng chung | Key còn dùng cho "protected workflow" (`WorkflowProtect.vue`, `utils/decryptFlow.js`) |

### 5.2 Bài học & thiết kế đề xuất cho Tuquet

**Nguyên tắc (học từ Automa):** secret ở **store mã hoá riêng**; workflow chỉ giữ **tham chiếu**; key **out-of-band** (không trong DB, không trong git); **scrub khỏi log + page-context**.

- **Store:** `~/.tq/system/credentials.json` (SSOT) — mỗi entry `{name, ciphertext}` (AES-GCM + HMAC), key từ OS keyring hoặc env `TQ_CREDENTIAL_KEY` (không commit).
- **Tham chiếu:** workflow dùng `{{secrets.hrms_username}}` / `{{secrets.hrms_password}}` — **không plaintext trong `graph_data`**.
- **CẦN BỔ SUNG ENGINE:** `resolve_expression` hiện chỉ hỗ trợ `variables|table|loopData|prevBlockData|globalData` — **thiếu `secrets.*`**. Phải thêm nhánh `secrets.` đọc từ credential store, và **scrub `secrets:{}` khi truyền vào page-context** (theo Automa) + che trong log (`worker/src/core/masker.rs` đã có Masker).
- **Migration:** gỡ plaintext khỏi `automation.workflows.graph_data` (`a27093ce`) + file local; thay bằng tham chiếu `{{secrets.*}}`; **rotate mật khẩu HRMS** sau khi test xong.

## 6. Quyết định đã chốt

| # | Hạng mục | Chốt |
| --- | --- | --- |
| 1 | Cách chạy | **Hybrid** — REST API cho đọc/tính/submit; CDP chỉ login + lấy JWT |
| 2 | Dispatch | **Supabase `automation.jobs`** + `claim_next_job`; worker fleet mode |
| 3 | Scheduler | **pg_cron + Edge Function scheduled** materialize schedules → jobs |
| 4 | Credential | **KHÔNG plaintext trong workflow** — secret store mã hoá + tham chiếu `{{secrets.*}}` (§5). ⚠️ Tạm thời (dev) creds đang là default param trong graph → **phải migrate** |
| 5 | Lịch | **08:00 Asia/Ho_Chi_Minh, T2–T6**; cutoff = hết ngày hôm trước |
| 6 | Submit | **Dry-run trước**, bật submit sau khi owner duyệt |
| 7 | `tools/hrms` | **Viết lại** adapter từ snippet + mock test |
| 8 | Target | Tenant admin `e0f30395-…`, workstation `HNDW-NDTU6`, profile `hrms-cmc` |
| 9 | Dispatch queue→worker | **(a) Worker claim trực tiếp Supabase** — vòng poll `rpc/claim_next_job` (không thêm service) |
| 10 | Lưu credential | **Theo pattern Automa** (§5): store mã hoá + tham chiếu `secrets.*` + key out-of-band + scrub log/page |

## 7. Phạm vi

**Trong phạm vi:** contract I/O của workflow · workflow template tái sử dụng · adapter HRMS fetch-based + mock test · **engine antidetect + profile `hrms-cmc` + lease + snapshot sync** · **CẦU NỐI queue→worker (claim loop)** · **credential store + `{{secrets.*}}` (engine change)** · chạy trên workstation fleet · enqueue + scheduler · dry-run/submit/idempotency/audit · zero-secret.

**Ngoài phạm vi:** Chromium trong scheduler · thay `tq auth login` · engine browser mới · đa nhà cung cấp HRMS · submit trước khi dry-run xác minh · lưu password plaintext.

## 8. Lộ trình

### Phase 0 — Provision antidetect browser ✅ (đã làm trên VPS, môi trường dev)
- [x] Provision engine `fingerprint-chromium v148` (`tq browser install 148`).
- [x] Tạo profile `hrms-cmc-03e6b9` (fingerprint VN).
- [x] Login HRMS thật (form) → session lưu trong profile.
- [ ] `tq browser profile verify` (CreepJS) — **chưa chạy**.
- [ ] Pack + `push` snapshot lên bucket `browser-profiles` (chưa — cloud chưa tạo profile).

**Verify:** `tq browser ps` thấy profile + pid/port; CDP `/json/version` OK; session sống.

### Phase 1 — Adapter HRMS (domain contract)
- [ ] Model typed cho request/response HRMS (theo §3.4).
- [ ] Viết lại adapter **fetch-based**, worker-compatible; token inject qua auth provider (đọc `session_login` qua CDP); không đọc `~/.hrms/config.json`.
- [ ] Typed errors: auth / rate-limit / invalid-period / API-failure / duplicate.
- [ ] Test: employee detail, period, timesheet, submit (dùng API thật, không mock).

**Verify:** adapter chạy ở Node + runtime worker; không log password/JWT; lỗi API kèm status an toàn.

### Phase 2 — Workflow Automation ✅ (dry-run đã chạy)
- [x] Workflow `hrms-timesheet-review` (12 nodes, login + params).
- [x] Session check → period + timesheet → phân tích `absent_time` → filter.
- [x] Guard current workday; nhánh `dry-run` + nhánh `submit`.
- [ ] Acquire lease ở đầu workflow (hiện ngoài graph — do `--cloud-profile`).
- [ ] Timeout + cancellation.

**Verify:** `tq automation inspect` pass; dry-run không mutate ✅; submit tắt được bằng policy.

### Phase 3 — Workstation browser & worker
- [ ] **Cầu nối queue → worker — hướng (a)** (CHƯA CÓ):
  - Vòng claim trong `worker/src/commands/worker.rs`: gọi REST `POST {cloud_url}/rest/v1/rpc/claim_next_job` `{p_worker_id, p_batch_size}`.
  - Claim được → dựng `Job` từ `automation.jobs.parameters` + fetch `automation.workflows.graph_data` → `engine.execute_job`.
  - Stream log → `automation.execution_logs`; kết thúc → cập nhật `automation.jobs.status/result_summary/ended_at`.
  - Tôn trọng `idempotency_key` + `reap_stale_jobs`; heartbeat `active_jobs`.
- [ ] Cài `tq` + chạy worker fleet mode (`tq worker start --cloud`).
- [ ] Vòng đời profile trong job: acquire lease → unpack → execute → pack delta → release.

**Verify:** workstation nhận job không tương tác; restart không tạo đơn trùng; cancel an toàn; lease luôn trả.

### Phase 4 — Auth & secret (§5)
- [ ] Thêm engine hỗ trợ `{{secrets.*}}` (`resolve_expression`) + scrub `secrets:{}` khỏi page-context + mask trong log.
- [ ] Credential store `~/.tq/system/credentials.json` (AES-GCM + HMAC), key out-of-band.
- [ ] Workflow dùng `{{secrets.hrms_username}}`/`{{secrets.hrms_password}}` thay plaintext.
- [ ] Migration gỡ plaintext khỏi `graph_data` + file local; rotate mật khẩu.
- [ ] Xử lý token hết hạn (fail an toàn, re-login recovery).

**Verify:** `graph_data` + log + job payload không chứa password/JWT; session hết hạn → fail an toàn.

### Phase 5 — Cloud scheduling & enqueue
- [ ] Migration: `automation.jobs.idempotency_key` + partial unique index (**cần owner duyệt**).
- [ ] `automation.enqueue_job(...)` (idempotent) + `automation.tick_schedules()`.
- [ ] Bật `pg_cron` + tick (VN 08:00 = 01:00 UTC); seed schedule `0 8 * * 1-5` / `Asia/Ho_Chi_Minh`.
- [ ] Retry cho lỗi tạm thời.

**Verify:** cron tạo job không chạy browser; retry không tạo đơn trùng; job hiện trong queue/status API.

### Phase 6 — Observability & rollout
- [ ] Metric queued/running/succeeded/failed; phân loại lỗi auth/browser/HRMS/policy.
- [ ] Audit record mọi ngày đề xuất/đã gửi; alert khi unexpected 0 eligible.
- [ ] Dry-run vài ngày làm việc; bật submit sau owner duyệt.

**Verify:** mỗi run có job id + idempotency key; operator xem plan trước khi bật submit; không trùng đơn.

## 9. First slice — ✅ phần local đã xong

1. ✅ engine + profile `hrms-cmc` + login HRMS thật.
2. ✅ workflow `hrms-timesheet-review` dry-run.
3. ✅ chạy local trên engine + profile → plan có cấu trúc (eligible/skipped).
4. ✅ chưa submit (0 eligible).
5. ⏳ còn: verify CreepJS + cloud profile + push snapshot.

## 10. Lệnh cần dùng

```powershell
# Build tq (dev, trên VPS) — xem skill tuquet-workspace
cd cli && git submodule update --init crates/faker && cargo build --bin tq
mkdir -p ~/.tq/{automation,worker,system}

# Phase 0 — antidetect browser
tq browser install 148
tq browser profile create hrms-cmc --os windows --timezone Asia/Ho_Chi_Minh --locale vi-VN
tq browser launch <id> --headless --cdp      # -> CDP 127.0.0.1:9222
tq browser profile verify hrms-cmc            # CreepJS
tq browser profile cloud acquire hrms-cmc     # lease

# Automation (local)
tq automation inspect <file>.workflow.json
tq automation run <file>.workflow.json --headless --browser-id <id>
# LƯU Ý: `run` nhận ĐƯỜNG DẪN FILE (positional), không phải id workflow.
tq automation run --cloud-profile hrms-cmc    # lease -> unpack -> execute -> pack -> release

# Cloud (sau Phase 3/5)
tq worker start --cloud
tq worker logs -f
```

## 11. Done criteria

- Engine antidetect provisioned; profile `hrms-cmc` deterministic, CreepJS pass, session HRMS sống qua pack/pull.
- Lease acquire/release hoạt động; không hai phiên song song; không kẹt lock.
- Workflow chạy end-to-end trên workstation đã enroll, dry-run không mutate.
- Cron tạo job qua `automation.jobs`, không chạy browser/Node trong scheduler.
- **Zero secret trong `graph_data`/payload/log/audit/git** (dùng `{{secrets.*}}`).
- Idempotent trước mọi request mutate; audit + alert; submit bật/tắt bằng policy.
- `cargo check`/`cargo test` sạch; không `cargo build --release` trên VPS.

## 12. STOP conditions

- HRMS cần DOM flow mà API không đủ → chốt lại Q1 (hybrid vs CDP).
- Schema change `automation.jobs` bị từ chối → không tự sửa; chờ duyệt.
- Fingerprint `hrms-cmc` bị nghi ngờ (CreepJS fail, challenge lặp) → xem lại seed/proxy.
- Session snapshot không tái sử dụng được → xin quyết định credential.
- Không `git push` / CI/CD trừ khi được yêu cầu (invariant #5).

## 13. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
| --- | --- | --- |
| Ghi đơn trùng lên HRMS | Cao | idempotency key + check Pending/Approved + dry-run |
| Hai phiên HRMS song song | Cao | lease `browsers.profiles` + reap stale lock |
| **Credential plaintext trong graph (hiện trạng)** | Cao | migrate sang `{{secrets.*}}` + store mã hoá + rotate (§5) |
| Session/JWT mất khi đổi máy | Trung bình | snapshot pack/push/pull |
| Fingerprint bị phát hiện | Trung bình | engine C++ fingerprint-chromium + CreepJS + webrtc shield |
| JWT hết hạn giữa chừng | Trung bình | detect expiry, fail an toàn |
| Login RSA đổi key/flow | Trung bình | dùng form browser (SPA tự mã hoá), không hard-code crypto |
| Hiểu sai `absent_time` | Trung bình | chỉ dùng `absent_time` server |
| Bật submit quá sớm | Cao | policy gate + owner approval |

## 14. Open items

1. Cột `idempotency_key` trên `automation.jobs` — **cần owner duyệt schema change**.
2. Flag CLI chạy workflow đã lưu theo id — cần xác nhận.
3. Mapping `reason_type` (mặc định `LOA_CORP_4`).
4. Kênh alert "không có ngày đủ điều kiện".
5. **Migrate credential khỏi `graph_data` → `{{secrets.*}}`; rotate mật khẩu HRMS** (§5).
6. Profile `hrms-cmc`: dùng proxy hay không?
7. `browsers.profiles.id` cloud của `hrms-cmc` — xác nhận sau khi tạo.
8. ~~Hướng dispatch queue→worker~~ — **RESOLVED: (a)**.
9. Cài & chạy worker trên máy nào? (VPS chưa có `tq`; thiết bị enroll là máy Windows).
10. Engine chưa hỗ trợ `secrets.*` — cần thêm nhánh resolve + scrub (§5.2).
