# Kế hoạch: HRMS Automation Workflow trên Tuquet

> Nguồn: [`hrms-automation-workflow.md`](./hrms-automation-workflow.md) — task đã re-lock theo **doctrine Automa schema** (đọc §0 của task trước khi sửa bất cứ thứ gì).
> **Doctrine (chốt 2026-10-24):** *Workflow document = Automa schema = SSOT duy nhất.* Không định nghĩa lại params/secrets/variables. Canvas khai báo mà engine bỏ qua = bug P0. `declared ⇒ satisfied` (thiếu ⇒ fail-fast).
> Trạng thái tổng (**kiểm tra lại 2026-10-24**): **Dry-run đã chạy thật end-to-end trên engine local** (§8) · **Secret Store ✅** (Phase 4A/4B/UI + hardening v2) · **workflow store đã cloud-first** (§3.2c). **Phải làm TRƯỚC: Phase 0b — Automa schema parity** (engine honour `trigger.data.parameters` + `{{secrets@name}}`). Còn lại: **Phase 3** (worker claim + workstation) · **Phase 5** (schedule/enqueue) · **Phase 6** (rollout).

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

### 3.2b Secret Store (cloud) — đã deploy

- Plugin **`secrets`** (schema `secrets`) đã **apply lên cloud `dswhacsoaxgpfnkaxnhz`**: bảng `secrets.credentials` (`value_enc`, `key_version`, unique `(tenant_id,name)`) + `secrets.tenant_keys` (DEK bọc bằng KEK).
- **KEK** = Vault secret `tq_secrets_kek`; **DEK per-tenant** (pgcrypto). RLS deny-by-default.
- RPC device-authenticated: `public.set_secret / list_secrets / fetch_secrets / rotate_secret_dek`.
- Đăng ký trong `public.system_plugins` (id `secrets`) + `cloud/supabase/seed.sql`.
- **As-built v2 (zero-knowledge over wire)**: value mã hoá **client-side** (XChaCha20-Poly1305); DEK **sealed per-device** bằng `crypto_box_seal` (X25519) → server **chỉ giữ ciphertext**; `.identity.json` mã hoá at-rest; `tq secret rotate`; plugin bump **v2.0.0**. SPEC: `docs/en/cloud/specs/SPEC-secret-store.md`.

### 3.2c Workflow store đã **cloud-first** (verified)

- PostgREST production **chỉ expose schema `public`** → `Accept-Profile: automation` trả `PGRST106`; console trước đây **nuốt lỗi** nên hiện danh sách rỗng.
- Giải pháp: RPC `public.workflow_list / workflow_get / workflow_upsert / workflow_delete` (SECURITY INVOKER, giữ RLS) trong `cloud/supabase/plugins/automation/install.sql` — **đã verify tồn tại trên cloud**.
- CLI: `cli/src/infrastructure/cloud/workflow_store.rs`; **7 callsite** (`automation store/table/inspector`, `status`, `tui`, MCP tools, engine `workflow_resolver`) đọc/ghi cloud; **local sqlite workflow store đã xoá** (23 files, −1.324 dòng).
- Console: `api/core/automation.ts::listWorkflows()` → `POST /rest/v1/rpc/workflow_list` (bỏ nhánh nuốt lỗi `Invalid schema`).

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

## 5. Secret Store — thiết kế Tuquet-native, device-portable

### 5.1 Mục tiêu & ràng buộc

- **Không** plaintext credential trong workflow `graph_data` / job payload / log / git.
- **Máy mới chạy job KHÔNG phải nhập lại credential** (yêu cầu gốc của owner).
- Tuân thủ kiến trúc Tuquet: multi-tenant + RLS (`is_tenant_member`/`has_tenant_permission`) + device enrollment (`workers.devices`) + SSOT `~/.tq/`.
- Tương thích Automa: workflow dùng `{{secrets@name}}` (học ý tưởng, **không copy** cơ chế).

### 5.2 Nguyên lý: envelope encryption + device key wrapping

```text
KEK (server-only, Supabase Vault/env)      <- không bao giờ rời server
  -> wrap -> DEK (1 per tenant)            <- mã hoá mọi secret value
       -> wrap lại -> DeviceKeypair.public (mỗi device 1 bản)
            -> device mở bằng private key (OS keyring)
```

- **KEK**: chỉ ở server; dùng để bọc DEK của tenant.
- **DEK**: một khoá dữ liệu mỗi tenant, mã hoá toàn bộ giá trị secret.
- **Device keypair**: sinh **local** khi `tq auth login`/enroll; public key đăng ký cloud.
- Cloud **bọc DEK** bằng public key của từng device -> device giải mã bằng private key -> có DEK -> decrypt mọi secret của tenant.
- => **Máy mới chỉ cần enroll là có ngay credential** — bảo đảm yêu cầu "không nhập lại".

### 5.3 Phía Cloud (SSOT)

- **Plugin mới `secrets`** (schema `secrets`), table `secrets.credentials`:
  `id, tenant_id, name, value_enc BYTEA, nonce BYTEA, key_version, created_by, created_at, updated_at, rotated_at`; **unique `(tenant_id, name)`**.
- **AS-BUILT (4B):** device auth dùng `workers.devices.device_token_hash` (SHA-256) — **không** cần bảng `secrets.devices` riêng; `fetch_secrets` trả value đã giải mã cho device hợp lệ. (`secrets.devices` + public_key/wrapped_dek = hardening v2.)
- **RPC** (SECURITY DEFINER): `secrets.set_secret`, `secrets.get_metadata`, `secrets.rotate_dek`, `secrets.deliver_dek(p_device_id, p_device_token)` — **chỉ trả ciphertext DEK đã bọc** cho device hợp lệ (verify `device_token_hash`).
- **RLS:** dùng `is_tenant_member` / `has_tenant_permission`; **ciphertext KHÔNG bao giờ trả cho browser** — chỉ ra qua RPC device-authenticated.
- **Permissions:** `secrets:read`, `secrets:manage`, `secrets:rotate`.
- **KEK** ở Supabase Vault (`[db.vault]` đã có trong `config.toml`) hoặc env server — không commit.

### 5.4 Phía Device / Local

- **Enroll** (`tq auth login`): sinh device keypair -> đăng ký public key -> nhận `wrapped_dek` -> private key vào **OS keyring**, `wrapped_dek` vào `~/.tq/system/`.
- **Cache:** `~/.tq/system/secrets.enc` (mã hoá bằng device key) -> chạy lại không cần gì; offline vẫn chạy.
- **Sửa luôn nợ bảo mật hiện tại:** `~/.tq/system/.identity.json` đang **plaintext** (chứa raw `device_token` + Supabase `access/refresh_token` — `cli/src/infrastructure/cloud/credential_store.rs`) -> **mã hoá bằng device key**.
- **Thu hồi device:** ngừng bọc DEK cho device đó (secret device khác không đổi). **Rotate DEK:** bọc lại cho device active.

### 5.5 Engine (worker)

- `resolve_expression` (`worker/src/drivers/cdp/workflow.rs`) **thêm nhánh `secrets.<name>`** (hiện chỉ có `variables|table|loopData|prevBlockData|globalData`).
- **Scrub:** khi truyền `refData` vào page-context (`javascript-code`), set `secrets:{}` — page-JS **không** thấy secret (theo Automa).
- **Mask** giá trị secret trong log qua `worker/src/core/masker.rs` (đã có `Masker`).
- **Không** ghi giá trị secret vào `variables` / `result_summary` / `execution_logs`.

### 5.6 Chế độ local-only (dev / chưa lên cloud)

- `~/.tq/system/secrets.json` mã hoá AES-256-GCM bằng key từ env `TQ_SECRET_KEY` hoặc OS keyring (tương đương `getPassKey` của Automa).
- Dùng cho dev + fallback; production dùng DEK cloud. Không commit `secrets.json`/key.

### 5.7 Workflow

- Thay plaintext bằng `{{secrets.hrms_username}}` / `{{secrets.hrms_password}}`.
- Graph chỉ giữ **tham chiếu** -> an toàn khi nằm trong cloud `automation.workflows.graph_data`.

### 5.8 Vì sao KHÔNG copy nguyên Automa

| Automa | Tuquet (lý do đổi) |
| --- | --- |
| Key hằng trong bundle (`getPassKey.js`) | Bundle client là public -> **không** an toàn. Tuquet dùng KEK server (Vault) + DEK bọc per-device. |
| Chỉ 1 máy (extension local) | Tuquet **đa device** -> cần **device key wrapping** để port credential. |
| Không multi-tenant | Tuquet **tenant-scoped** + RLS + RBAC. |
| IndexedDB (browser) | Tuquet SSOT `~/.tq/system/` + engine Rust. |
| Giữ điểm hay | `{{secrets@name}}` reference · AES+HMAC · **scrub page-context** · không secret trong workflow. |

### 5.9 Migration & rotate

1. Chuyển credential HRMS từ `automation.workflows.graph_data` (`a27093ce`) -> secret store (`name='hrms-cmc'`).
2. Cập nhật graph + file local -> tham chiếu `{{secrets@name}}` (hết plaintext).
3. **Rotate mật khẩu HRMS** sau khi test xong.

## 6. Quyết định đã chốt

| # | Hạng mục | Chốt |
| --- | --- | --- |
| 1 | Cách chạy | **Hybrid** — REST API cho đọc/tính/submit; CDP chỉ login + lấy JWT |
| 2 | Dispatch | **Supabase `automation.jobs`** + `claim_next_job`; worker fleet mode |
| 3 | Scheduler | **pg_cron + Edge Function scheduled** materialize schedules → jobs |
| 4 | Credential | **KHÔNG plaintext trong workflow** — Secret Store mã hoá + tham chiếu `{{secrets@name}}`, **device-portable** (§5). ⚠️ Hiện (dev) creds đang là literal trong graph → **phải migrate + rotate** |
| 5 | Lịch | **08:00 Asia/Ho_Chi_Minh, T2–T6**; cutoff = hết ngày hôm trước |
| 6 | Submit | **Dry-run trước**, bật submit sau khi owner duyệt |
| 7 | `tools/hrms` | **Viết lại** adapter từ snippet + mock test |
| 8 | Target | Tenant admin `e0f30395-…`, workstation `HNDW-NDTU6`, profile `hrms-cmc` |
| 9 | Dispatch queue→worker | **(a) Worker claim trực tiếp Supabase** — vòng poll `rpc/claim_next_job` (không thêm service) |
| 10 | Lưu credential | **Secret Store Tuquet-native** (§5): KEK server (Vault) + DEK per-tenant bọc per-device + `{{secrets@name}}` + scrub log/page. Học Automa nhưng KHÔNG copy (Automa key nằm trong bundle client) |

## 7. Phạm vi

**Trong phạm vi:** contract I/O của workflow · workflow template tái sử dụng · adapter HRMS fetch-based + mock test · **engine antidetect + profile `hrms-cmc` + lease + snapshot sync** · **CẦU NỐI queue→worker (claim loop)** · **credential store + `{{secrets@name}}` (engine change)** · chạy trên workstation fleet · enqueue + scheduler · dry-run/submit/idempotency/audit · zero-secret.

**Ngoài phạm vi:** Chromium trong scheduler · thay `tq auth login` · engine browser mới · đa nhà cung cấp HRMS · submit trước khi dry-run xác minh · lưu password plaintext.

## 8. Lộ trình

### Phase 0 — Provision antidetect browser ✅ (đã làm trên VPS, môi trường dev)
- [x] Provision engine `fingerprint-chromium v148` (`tq browser install 148`).
- [x] Tạo profile `hrms-cmc-03e6b9` (fingerprint VN).
- [x] Login HRMS thật (form) → session lưu trong profile.
- [ ] `tq browser profile verify` (CreepJS) — **chưa chạy**.
- [ ] Pack + `push` snapshot lên bucket `browser-profiles` (chưa — cloud chưa tạo profile).

**Verify:** `tq browser ps` thấy profile + pid/port; CDP `/json/version` OK; session sống.

### Phase 0b — Automa schema parity (engine) ⬜ **làm TRƯỚC tiên**

- [ ] Engine đọc **`trigger.data.parameters`** (contract do canvas khai báo) → seed default + type.
- [ ] Resolve **`{{secrets@name}}`** (dialect Automa) + scrub qua masker; giữ `{{variables.*}}`, `{{table.*}}`, `{{loopData.*}}`.
- [ ] Map `trigger.type` ⇄ nguồn kích hoạt; **fleet cấm `type = manual`**.
- [ ] Honour `settings{onError, blockDelay, concurrency}`; field chưa hỗ trợ ⇒ **cảnh báo**, không im lặng.
- [ ] **Publish-time validation** trong `public.workflow_upsert` (thiếu default / manual ở fleet / plaintext ⇒ reject).
- [ ] Xoá cột chết `automation.workflows.variables`.

**Verify:** chạy workflow HRMS **không** truyền `-p` ⇒ lấy default từ trigger (không cần fallback trong block).

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

### Phase 4 — Secret Store (§5) — Tuquet-native, device-portable ✅ (4A + 4B + UI shipped)

**4A — Engine + local ✅**
- [x] `resolve_expression` thêm nhánh `secrets.<name>`; `ExecutionState.secrets` + `set_secret()`.
- [x] Mask giá trị secret trong log (`SecretMasker::add_custom_secret(&self)` — interior mutability qua `Arc`).
- [x] Local store `worker/src/core/secrets.rs` — `~/.tq/system/secrets.json` AES-256-GCM, key `TQ_SECRET_KEY` hoặc `.secret_key` (0600); CLI `tq secret init/set/list/rm/path`.
- [x] Seed secret ở **cả 2 đường**: `worker/drivers/automation.rs` (`execute_native_cdp`) **và** `cli/…/job_coordinator.rs` (`run_native_job` — đường local, đã phát hiện bypass engine).
- [x] Workflow dùng `{{secrets.hrms_username}}`/`{{secrets.hrms_password}}`; graph + file local đã gỡ literal.
- [~] Scrub `secrets:{}` page-context: **không cần** — engine không truyền refData vào page; secret chỉ vào code-string khi tác giả dùng `{{secrets@name}}` (đã mask log).

**4B — Cloud + portability ✅ (design as-built)**
- [x] Plugin **`secrets`** (`cloud/supabase/plugins/secrets/install.sql` + `plugin.json`): schema `secrets`, `secrets.credentials` (value_enc/key_version), `secrets.tenant_keys` (DEK bọc bằng KEK).
- [x] **KEK trong Supabase Vault** (`tq_secrets_kek`); **DEK per-tenant** (pgcrypto `pgp_sym_encrypt`).
- [x] RPC (device-authenticated qua `device_token` SHA-256): `set_secret`/`list_secrets`/`fetch_secrets`/`rotate_secret_dek` (+ wrapper `public.*`); RLS deny-by-default + revoke anon/authenticated trên bảng.
- [x] CLI `tq secret push/pull/remote` — `fetch_secrets` trả value cho device hợp lệ.
- [x] **Đã verify device-portable**: xoá local store → `tq secret pull` → secrets trở lại → `tq automation run` chạy 9 bước (không nhập lại credential).
- [x] **Hardening v2 ✅** — `tq secret init` sinh **device keypair X25519**; DEK **sealed per-device** (`crypto_box_seal`); value **mã hoá client-side** (XChaCha20-Poly1305) → server KHÔNG nhận plaintext; **`.identity.json` mã hoá at-rest**; `tq secret rotate`.
- [x] **Workstation UI ✅** — console `apps/workstation` page **`SecretsCredentials`** (`/secrets/credentials`) — route phản chiếu **schema+table** (`secrets.credentials`), KHÔNG dùng `/system/secrets` + CLI daemon API `/api/v1/secrets*`; permissions `secrets:credentials:read|manage` + `secrets:store:rotate` đã đăng ký vào `public.permissions`/`role_permissions`; term SSOT cập nhật (`term.json`, `terminology.md` §3.7 + lexicon + checklist #11).
- [ ] **v3** — key trong OS keyring/TPM + audit trail truy cập secret.
- [ ] **Rotate mật khẩu HRMS** — cần user đổi tại CMC Global (không tự đổi được từ VPS); sau đó `tq secret set hrms_password <mới>` + `tq secret push` trên máy đã enroll.

**Design as-built (cập nhật v2 — khớp plan gốc §5.2):** DEK bọc KEK ở server; **DEK được seal (X25519 `crypto_box_seal`) tới từng device**; device mở bằng private key; **value mã hoá client-side** (XChaCha20-Poly1305) nên **server không bao giờ nhận plaintext**. Đã verify tương thích crypto Rust ↔ pgsodium **2 chiều** (lưu ý: pgsodium chỉ grant `crypto_box_seal*` cho role `postgres`, nonce seal = `BLAKE2b-192(epk‖pk)`, layout `epk‖ct‖tag`; `encode(...,'base64')` của Postgres chèn newline → plugin strip).

**Verify:** `graph_data`/payload/log không chứa password/JWT ✅; máy mới `tq secret pull` chạy được job ✅; token sai bị từ chối ✅.

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
- **Zero secret trong `graph_data`/payload/log/audit/git** (dùng `{{secrets@name}}`).
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
| ~~Credential plaintext trong graph~~ ✅ **đã xử lý** | — | migrate sang `{{secrets@name}}` + store mã hoá; **verify cloud `has_cred=false`** (2026-10-24). Còn nợ: **rotate mật khẩu HRMS** tại CMC |
| Session/JWT mất khi đổi máy | Trung bình | snapshot pack/push/pull |
| Fingerprint bị phát hiện | Trung bình | engine C++ fingerprint-chromium + CreepJS + webrtc shield |
| JWT hết hạn giữa chừng | Trung bình | detect expiry, fail an toàn |
| Login RSA đổi key/flow | Trung bình | dùng form browser (SPA tự mã hoá), không hard-code crypto |
| Hiểu sai `absent_time` | Trung bình | chỉ dùng `absent_time` server |
| Bật submit quá sớm | Cao | policy gate + owner approval |

## 14. Open items

1. **Schema change (cần owner duyệt):** `jobs.idempotency_key` + `jobs.schedule_id` + `jobs.params_snapshot` · `schedules.parameters` · bảng `automation.workflow_state` · `enqueue_job()` + `tick_schedules()` · **drop `automation.workflows.variables`**.
2. Flag CLI chạy workflow đã lưu theo id — cần xác nhận.
3. Mapping `reason_type` (mặc định `LOA_CORP_4`).
4. Kênh alert "không có ngày đủ điều kiện".
5. ✅ **DONE** (2026-10-24) — credential đã migrate khỏi `graph_data` → `{{secrets@name}}` (dialect Automa); verify cloud `has_cred=false`. **Còn nợ: rotate mật khẩu HRMS** (owner tự đổi tại CMC).
6. Profile `hrms-cmc`: dùng proxy hay không?
7. `browsers.profiles.id` cloud của `hrms-cmc` — xác nhận sau khi tạo.
8. ~~Hướng dispatch queue→worker~~ — **RESOLVED: (a)**.
9. Cài & chạy worker trên máy nào? (VPS chưa có `tq`; thiết bị enroll là máy Windows).
10. ✅ **DONE** (nhưng **phải đổi dialect** `secrets.*` → `{{secrets@name}}` — Phase 0b/4).
11. ✅ **DONE** — plugin `secrets` **v2** đã apply + đăng ký `seed.sql`; device keypair X25519 + DEK sealed per-device (§5.2-5.4); E2E 2-device đã test.

## 15. Nhật ký kiểm tra (2026-10-24)

- Verify lại cloud + code: workflow `a27093ce…` = **12 nodes**, **`has_cred=false`** (0 plaintext), `status=draft`, `v1.0.0` ✔ khớp §3.2.
- RPC `public.workflow_*` **tồn tại** trên cloud ✔ → ghi nhận §3.2c (trước đây plan không nhắc).
- `automation.jobs.idempotency_key` **vẫn chưa có** → open item #1 còn nguyên (cần owner duyệt schema change).
- `tools/hrms` **vẫn không tồn tại** → Phase 1 chưa làm.
- Ngoài phạm vi plan này (ghi để khỏi lẫn khi handoff): (a) console hardening observability — render error handler + i18n interpolation guard (`docs/.../SPEC-cross-error-observability.md` §Render-Safety v1.1); (b) repo infra **`tuquet/relay`** (Cloudflare Worker error relay → Telegram group).

## 16. Nhật ký quyết định (2026-10-24, chiều)

- **Doctrine chốt:** xây workflow **trên schema Automa** để dùng lại canvas kéo-thả ⇒ không định nghĩa lại params/secrets.
- **Đổi dialect:** `{{secrets.*}}` → **`{{secrets@name}}`** (phải migrate workflow `a27093ce` + engine + CLI + docs).
- **Contract tham số = `trigger.data.parameters[]`** (đã có trong schema) — rút lại đề xuất thêm `param_schema`.
- **Bỏ fallback trong block** → thay bằng publish-time validation + fail-fast.
- **Task IG DM booking đã xoá** khỏi `tasks/` (viết lại sau, dựa trên mô hình đã chốt + Phase 0b).
- Cột `automation.workflows.variables` → **xoá** (trùng chức năng trigger params, đang chết).

## 17. Nhật ký thực thi (2026-10-24, tối)

| Việc | Trạng thái | Bằng chứng |
| --- | --- | --- |
| Phase 0b — engine honour `trigger.data.parameters` | ✅ | chạy HRMS **không `-p`**: `mode=dry-run`, `minLateMinutes=1`, `maxLateMinutes=60`, `reasonType=LOA_CORP_4` |
| Phase 0b — dialect `{{secrets@name}}` | ✅ | login bằng Secret Store, `options.variables=null` |
| Publish-time validation (SQL) | ✅ | thiếu `defaultValue` / trùng tên / plaintext ⇒ **REJECT** |
| Drop `workflows.variables` | ✅ | cột đã xoá trên cloud; workflow `a27093ce` migrate **v1.1.1** |
| **P0** — block không hỗ trợ ⇒ fail rõ ràng | ✅ | `google-sheets` ⇒ *"refusing to run (declared => satisfied)"* |
| **P0** — schema `workflow.schema.json` enforce thật | ✅ | `jsonschema` + `include_str!` trong `resolve`; 130 test CLI PASS |
| **P1** — `isDisabled` / `restartTimes` / `saveLog` / root `trigger` / `global_data` | ✅ | 41 test worker PASS |
| Bonus: `strip_nulls` (pipeline tự vi phạm schema) · test suite CLI/worker compile lại · `automa`→`automation` serde | ✅ | — |

Còn lại: P1 (cloud publish check block labels) · `includedWorkflows` · `table`/`dataColumns` · Phase 3 (worker claim + lease) · Phase 5 (schedule/enqueue).

### 17.1 Bổ sung (implement block + parity document)

| Việc | Trạng thái | Bằng chứng |
| --- | --- | --- |
| `export-data` (csv/json/plain-text, BOM, delimiter, onConflict, `TQ_EXPORT_DIR`) | ✅ | chạy thật: `sites.csv` 46B, BOM `EF BB BF`, header theo `table`, 2 cột **cùng 1 row** |
| `execute-workflow` (subflow từ `includedWorkflows`, `{{workflow.<key>.variables.*}}`, `insertAllVars`, guard loop/depth) | ✅ | 3 test worker |
| `table` / `dataColumns` (tên + type cột) | ✅ | `export-data` dùng đúng thứ tự cột |
| **Bug parity `insert-data`**: nhiều cột bị tách thành nhiều row | ✅ fixed | cursor per-column theo `WorkflowData.addDataToColumn` |
| **Type coercion** theo cột (`convertData`) | ✅ | `"200"`→200, `"ℹ301 extra"`→301 |
| `note` → canvas-only · `delay` string|number (khớp export thật) · coverage check đọc cả `drawflow.nodes` | ✅ | 5 fixture export Automa thật |
| Export Automa **nguyên bản** chạy end-to-end | ✅ | `automa-export-google-search.json` → 4 bước, browser thật |
| Còn lại | ⏳ | `google-sheets` / `google-drive` / `ai-workflow` (cần credential Google) |

Docs: `docs/en/automation/blocks.md` (+ sidebar) — block coverage, quy tắc *declared ⇒ satisfied*, `export-data`, `execute-workflow`, data table.
