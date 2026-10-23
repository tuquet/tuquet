# Kế hoạch: HRMS Automation Workflow trên Tuquet

> Nguồn: [`hrms-automation-workflow.md`](./hrms-automation-workflow.md) — task gốc đã audit & chốt thiết kế.
> Trạng thái tổng: **Design locked / Ready for implementation** (v0 workflow đã tạo trên cloud).

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

## 3. Hiện trạng (đã xác minh trên code + cloud)

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

### 3.2 Đã tạo trên cloud

- `automation.workflows` → **`HRMS Timesheet Review`**, id `a27093ce-a768-4e3a-bcc1-e4d87da6157c`, tenant admin, `status=draft`, graph 10 nodes / 9 edges (schema-valid).

### 3.3 Khoảng trống đã phát hiện lúc audit (đã xử lý bằng quyết định)

1. `tools/hrms` **không còn tồn tại** → viết lại adapter từ snippet trong task.
2. Mâu thuẫn dispatch: pseudocode cũ `POST /api/v1/jobs` là **localhost-only** → chuyển sang `automation.jobs`.
3. Không có `pg_cron`/edge fn materialize schedule → phải thêm.
4. Lệnh verify `tq automation run <id>` **sai** (positional là đường dẫn file).
5. **Worker KHÔNG claim từ `automation.jobs`** — `grep claim_next_job` toàn workspace = **0 caller**; queue `automation.jobs` hiện là **bảng chết** (chỉ console đọc để hiển thị).
6. **Không có control-plane nào gửi `DispatchJob`** — `grep DispatchJob` toàn workspace chỉ thấy phía **client** trong worker; server push **chưa tồn tại**.
7. **Chưa cài `tq` trên VPS, chưa có worker daemon chạy** — `which tq` = not found; thiết bị enroll `HNDW-NDTU6` là **máy Windows**, không phải VPS này.

## 4. Entity: Browser anti-detect (bổ sung — trọng tâm)

HRMS yêu cầu một **danh tính trình duyệt ổn định, tách biệt và chống phát hiện** để giữ session đăng nhập bền vững. Đây là entity hạng nhất trong kế hoạch, không phải chi tiết phụ.

### 4.1 Engine (fingerprint-chromium)

- Engine nền: **`adryfish/fingerprint-chromium`** (`browser_type='ungoogled-chromium'`, `engine_version='148.0.7778.215'`).
- Fingerprint áp ở tầng **C++ engine** (Canvas 2D noise, WebGL params, AudioContext DSP, font metrics, `Math.random` PRNG) — **không** dùng extension shim JS (dễ bị `Function.toString`/`getOwnPropertyDescriptor` phát hiện).
- Catalog release tải từ `browsers.releases` (Supabase / GitHub), verify SHA-256 → provision qua `tq browser runtime`.

### 4.2 Profile entity — `browsers.profiles`

Một profile = một danh tính phần cứng **deterministic** + sandbox + snapshot session:

| Nhóm | Trường | Ý nghĩa |
| --- | --- | --- |
| Định danh | `id`, `tenant_id`, `name`, `group_name`, `tags` | `hrms-cmc` thuộc tenant admin |
| Fingerprint lõi | **`fingerprint_seed`** (BIGINT) | Một seed duy nhất, tất định, chi phối toàn bộ Canvas/WebGL/Audio/font/PRNG |
| Nền tảng | `os_platform`, `os_version`, `browser_brand`, `cpu_cores`, `ram_gb` | spoof phần cứng (mặc định windows/10.0.0/Chrome/8/16) |
| Hiển thị | `screen_width`, `screen_height`, `device_pixel_ratio` | hình học + HiDPI scale |
| Ngôn ngữ & headers | `timezone`, `locale`, `accept_languages`, `user_agent`, `sec_ch_ua`, `sec_ch_ua_platform`, `sec_ch_ua_mobile` | khớp `Asia/Ho_Chi_Minh` + `vi-VN` như cổng HRMS |
| Mạng | `proxy_id`, `custom_proxy`, `change_ip_url`, `auto_timezone`, `auto_locale`, **`webrtc_mode='proxy_shielded'`** | chống rò IP qua WebRTC STUN |
| Snapshot phiên | `storage_path`, `storage_size_bytes`, `storage_hash`, `cookies_count`, `last_synced_at` | đồng bộ `localStorage`/cookie/JWT |
| **Lease** | `status` (idle/running/syncing/error), **`locked_by_device_id`**, `locked_at`, `last_launched_at` | khóa độc quyền 1 thiết bị |
| Khởi động | `startup_flags`, `extensions`, `metadata` | stealth default = `[]` |

- Preset fingerprint: `browsers.fingerprint_templates` (`is_system` hoặc theo tenant) → tạo profile 1-click.
- Sandbox local: `~/.tq/browser/profiles/<profile_id>/` gồm `profile.json` (seed phần cứng), `Default/` (Cookies, Local Storage, IndexedDB, Network), `extensions/`.

### 4.3 Lease độc quyền (bắt buộc cho HRMS)

- RPC: `browsers.acquire_profile` / `browsers.release_profile` / `browsers.reap_stale_profile_locks` (public wrapper: `acquire_browser_profile`, `release_browser_profile`).
- CLI: `tq browser profile cloud acquire <id>` / `release <id>`.
- **Bảo đảm chỉ MỘT workstation dùng `hrms-cmc` tại một thời điểm** → không có hai phiên HRMS song song (nguồn gốc của submit trùng / session bị đá).
- Stale lock được dọn tự động (`reap_stale_profile_locks`, default 10 phút) — khớp với `reap_stale_jobs`.

### 4.4 Đồng bộ snapshot phiên (session reuse)

- Pack `tq browser profile pack <id>` → `.tar.zst` (lọc cache, < ~15 MB); `unpack` khôi phục.
- `push` / `pull` qua Supabase Storage bucket `browser-profiles` → **resume session trên máy/worker khác mà không cần login lại**.
- `tq automation run --cloud-profile <id>` tự động: **acquire lease → unpack snapshot → verify proxy → execute → pack delta → release lease**.
- `tq browser profile verify` chạy CreepJS để xác nhận fingerprint không bị lộ (trước khi tin tưởng profile `hrms-cmc`).

### 4.5 Áp vào HRMS

- Tạo profile **`hrms-cmc`** (tenant admin): `os=windows`, `timezone=Asia/Ho_Chi_Minh`, `locale=vi-VN`, `accept_languages=vi-VN,vi,en-US,en`, `webrtc_mode=proxy_shielded`; **login tay 1 lần** để lưu cookie/JWT vào snapshot.
- Workflow dùng profile qua `browserId: hrms-cmc` (job `options`) hoặc `--cloud-profile`.
- Liên kết local ↔ cloud: `profile.json.cloud_id` trỏ tới `browsers.profiles.id`.
- **Bảo mật:** snapshot chứa cookie/JWT → **không commit, không log, không đưa vào payload job** (nhất quán quyết định #4).

## 5. Quyết định đã chốt

| # | Hạng mục | Chốt |
| --- | --- | --- |
| 1 | Cách chạy | **Hybrid** — REST API cho đọc/tính/submit; CDP chỉ login + lấy JWT |
| 2 | Dispatch | **Supabase `automation.jobs`** + `claim_next_job`; worker fleet mode |
| 3 | Scheduler | **pg_cron + Edge Function scheduled** materialize schedules → jobs |
| 4 | Credential | **Không lưu gì** — chỉ browser profile `hrms-cmc` đã login (zero-secret) |
| 5 | Lịch | **08:00 Asia/Ho_Chi_Minh, T2–T6**; cutoff = hết ngày hôm trước |
| 6 | Submit | **Dry-run trước**, bật submit sau khi owner duyệt |
| 7 | `tools/hrms` | **Viết lại** adapter từ snippet + mock test |
| 8 | Target | Tenant admin `e0f30395-…`, workstation `HNDW-NDTU6`, profile `hrms-cmc` |
| 9 | Dispatch queue→worker | **(a) Worker claim trực tiếp Supabase** — vòng poll `rpc/claim_next_job` trong worker Rust (không thêm service; outbound-only qua NAT) |

## 6. Phạm vi

**Trong phạm vi:** contract I/O của workflow · workflow template tái sử dụng · adapter HRMS fetch-based + mock test · **engine antidetect + profile `hrms-cmc` + lease + snapshot sync** · **CẦU NỐI queue→worker (claim loop hoặc control-plane WS) — hiện chưa có** · chạy trên workstation fleet · enqueue + scheduler trên cloud · dry-run/submit/idempotency/audit · lưu status + logs · zero-secret.

**Ngoài phạm vi:** Chromium trong scheduler · thay `tq auth login` · engine browser mới · đa nhà cung cấp HRMS · submit trước khi dry-run được xác minh · lưu password plaintext.

## 7. Lộ trình

### Phase 0 — Provision antidetect browser (mới)
- [ ] Provision engine `fingerprint-chromium v148` từ `browsers.releases` (`tq browser runtime`), verify SHA-256.
- [ ] Tạo profile **`hrms-cmc`** với fingerprint VN (`timezone=Asia/Ho_Chi_Minh`, `locale=vi-VN`, windows, webrtc shield).
- [ ] **Login tay 1 lần** vào HRMS → lưu cookie/JWT vào snapshot profile.
- [ ] `tq browser profile verify` (CreepJS) — fingerprint không bị lộ.
- [ ] Pack + `push` snapshot lên bucket `browser-profiles`; liên kết `cloud_id`.
- [ ] Kiểm tra lease: `acquire`/`release` + `reap_stale_profile_locks`.

**Verify:** `tq browser profile inspect hrms-cmc` hiển thị đầy đủ hardware/seed; CreepJS pass; `tq browser profile cloud acquire hrms-cmc` lấy được lease và `release` trả lại; session HRMS còn sống sau unpack trên máy khác.

### Phase 1 — Adapter HRMS (domain contract)
- [ ] Model typed cho request/response HRMS API.
- [ ] Viết lại `tools/hrms/src/api.js` thành adapter **fetch-based**, worker-compatible (không dùng fs).
- [ ] Token inject qua auth provider (đọc từ profile qua CDP); không đọc `~/.hrms/config.json`.
- [ ] Typed errors: auth / rate-limit / invalid-period / API-failure / duplicate.
- [ ] Mock test: employee detail, period, timesheet, submit.

**Verify:** adapter chạy ở Node + runtime worker; không log password/JWT; lỗi API kèm status + message an toàn; mock test pass.

### Phase 2 — Workflow Automation
- [ ] Workflow `hrms-timesheet-review` (v0 draft đã có — tinh chỉnh; bổ sung bước acquire lease đầu workflow).
- [ ] Validate biến đầu vào (`period`, `mode`, `minLateMinutes`, `maxLateMinutes`, `excludeDates`).
- [ ] Session check (qua profile `hrms-cmc`) → lấy period + timesheet → phân tích `absent_time` → filter existing/excluded.
- [ ] Guard current workday (bỏ `date >= today`).
- [ ] Nhánh `dry-run` + nhánh `submit` (policy-gated).
- [ ] Timeout + cancellation.

**Verify:** `tq automation inspect hrms-timesheet-review` pass; chạy local với profile `hrms-cmc`; dry-run không mutate; submit tắt được bằng policy.

### Phase 3 — Workstation browser & worker
- [ ] **Xây cầu nối queue → worker — hướng (a) ĐÃ CHỐT (CHƯA CÓ, việc mới, bắt buộc):**
  - Vòng claim trong daemon (`worker/src/commands/worker.rs`): mỗi N giây gọi REST `POST {cloud_url}/rest/v1/rpc/claim_next_job` với `{ p_worker_id, p_batch_size }` (device token + apikey).
  - Khi claim được: dựng `Job` từ `automation.jobs.parameters` + fetch `automation.workflows.graph_data` → `engine.execute_job`.
  - Stream log → `automation.execution_logs`; kết thúc → cập nhật `automation.jobs.status/result_summary/ended_at` (RPC hoặc REST PATCH).
  - Tôn trọng `idempotency_key` + `reap_stale_jobs` (không claim lại job chết); heartbeat cập nhật `workers.devices.active_jobs`.
- [ ] Tài liệu setup workstation bằng `tq auth login` + profile antidetect.
- [ ] Cài `tq` + chạy worker daemon **fleet mode** (`tq worker start --cloud`).
- [ ] Vòng đời profile trong job: acquire lease → unpack → execute → pack delta → release.
- [ ] Stream log → `automation.execution_logs`; result → `job.result_summary`.

**Verify:** workstation nhận job không cần tương tác; chạy đúng profile `hrms-cmc`; restart worker không tạo đơn trùng; cancel dừng an toàn; lease luôn được trả (không kẹt lock).

### Phase 4 — Auth & secret
- [ ] Tách Cloud auth khỏi HRMS auth.
- [ ] HRMS auth = profile antidetect đã login (không lưu password).
- [ ] JWT đọc từ profile (in-memory) → truyền cho adapter.
- [ ] Headless re-login = recovery path thủ công (chỉ khi snapshot mất session).
- [ ] Không đưa password/JWT/cookie vào payload/log/audit.
- [ ] Xử lý token hết hạn (fail an toàn, thông báo rõ).

**Verify:** payload job không chứa password/JWT; session hết hạn → fail an toàn; re-auth được ghi lại không lộ token.

### Phase 5 — Cloud scheduling & enqueue
- [ ] Migration: thêm `automation.jobs.idempotency_key` + partial unique index.
- [ ] Hàm `automation.enqueue_job(...)` (idempotent).
- [ ] Hàm `automation.tick_schedules()`.
- [ ] Bật `pg_cron` + đăng ký tick (VN 08:00 = 01:00 UTC).
- [ ] Seed 1 row `automation.schedules`: `cron_expression='0 8 * * 1-5'`, `timezone='Asia/Ho_Chi_Minh'`.
- [ ] Chống trùng theo idempotency key; retry cho lỗi tạm thời.

**Verify:** cron tạo job không chạy browser; retry không tạo đơn trùng; job hiện trong queue/status API; schedule audit được theo tenant + ngày.

### Phase 6 — Observability & rollout
- [ ] Metric queued/running/succeeded/failed.
- [ ] Phân loại lỗi: auth/browser/HRMS-API/policy.
- [ ] Audit record cho mọi ngày đề xuất/đã gửi.
- [ ] Alert khi không tìm thấy ngày đủ điều kiện (bất thường).
- [ ] Chạy dry-run vài ngày làm việc đầy đủ.
- [ ] Bật submit sau khi owner duyệt.

**Verify:** mỗi lần chạy có job id + idempotency key; operator xem được plan trước khi bật submit; không trùng đơn cho cùng employee/date/type.

## 8. First slice (làm trước, không phụ thuộc Phase 5)

1. **Phase 0**: engine + profile `hrms-cmc` + login tay + verify CreepJS + lease.
2. Workstation `tq auth login` đã chạy.
3. Thêm `hrms-timesheet-review` ở chế độ **dry-run**.
4. Chạy **local** trên workstation + profile `hrms-cmc`.
5. Trả plan có cấu trúc (eligible/skipped).
6. **Chưa** submit. **Chưa** thêm Cloud scheduler cho tới khi job local chạy được.

## 9. Lệnh cần dùng

```powershell
# Phase 0 — antidetect browser
tq browser runtime                       # provision engine fingerprint-chromium
tq browser profile create hrms-cmc --os windows --timezone Asia/Ho_Chi_Minh --locale vi-VN
tq browser profile inspect hrms-cmc
tq browser profile cloud acquire hrms-cmc
tq browser profile cloud release hrms-cmc
tq browser profile verify hrms-cmc       # CreepJS stealth check
tq browser profile pack hrms-cmc
tq browser profile push hrms-cmc         # snapshot -> bucket browser-profiles

# Workstation
tq auth login
tq worker status

# Automation
tq automation inspect hrms-timesheet-review
# LƯU Ý: `run` nhận ĐƯỜNG DẪN FILE làm positional đầu, không phải id workflow.
tq automation run <path>.workflow.json --headless --timeout 300
tq automation run --cloud-profile hrms-cmc   # acquire lease -> unpack -> execute -> pack -> release

# Cloud (sau Phase 5)
tq worker start --cloud
tq worker logs -f
```

## 10. Done criteria

- Engine antidetect provisioned; profile `hrms-cmc` deterministic, CreepJS pass, session HRMS còn sống qua pack/pull.
- Lease acquire/release hoạt động; không có hai phiên HRMS song song; không kẹt lock.
- Workflow chạy end-to-end trên workstation đã enroll, dry-run không mutate HRMS.
- Cron tạo job qua `automation.jobs`, không chạy browser/Node trong scheduler.
- Zero secret (password/JWT/cookie/profile) trong payload/log/audit/git.
- Idempotent trước mọi request mutate; có audit + alert; submit bật/tắt bằng policy.
- `cargo check`/`cargo test` sạch; không `cargo build --release` trên VPS.

## 11. STOP conditions

- Nếu thao tác HRMS cần DOM flow mà API không đủ → dừng, chốt lại Q1 (hybrid vs CDP).
- Nếu schema change `automation.jobs` bị từ chối → không tự ý sửa; chờ duyệt.
- Nếu fingerprint `hrms-cmc` bị HRMS/anti-bot nghi ngờ (CreepJS fail, challenge lặp) → dừng, xem lại seed/proxy.
- Nếu session snapshot không tái sử dụng được → dừng, xin quyết định credential.
- Không `git push` / không trigger CI/CD trừ khi được yêu cầu (invariant #5).

## 12. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
| --- | --- | --- |
| Ghi đơn trùng lên HRMS | Cao | idempotency key + check `Pending/Approved` + dry-run trước |
| Hai phiên HRMS song song (đá session) | Cao | **lease `browsers.profiles`** + reap stale lock |
| Session/JWT mất khi đổi máy | Trung bình | snapshot pack/push/pull (bucket `browser-profiles`) |
| Fingerprint bị phát hiện | Trung bình | engine C++ fingerprint-chromium + CreepJS verify + webrtc shield |
| JWT hết hạn giữa chừng | Trung bình | Detect expiry, fail an toàn, re-login thủ công |
| Vỡ khi HRMS đổi API | Trung bình | Typed adapter + mock test; fail-fast |
| Hiểu sai `absent_time` vs lateness | Trung bình | Chỉ dùng `absent_time` server |
| Bật submit quá sớm | Cao | Policy gate + owner approval |

## 13. Open items

1. Cột `idempotency_key` trên `automation.jobs` — **cần owner duyệt schema change**.
2. Flag CLI chạy workflow đã lưu theo id — cần xác nhận.
3. Mapping `reason_type` (mặc định `LOA_CORP_4`, có cần thêm?).
4. Kênh alert "không có ngày đủ điều kiện".
5. Đồng bộ workflow cloud (`a27093ce-…`) về máy để chạy local (CLI đọc SQLite local).
6. **Profile `hrms-cmc`: dùng proxy hay không?** (HRMS nội bộ CMC — nếu IP công ty ổn định có thể không cần proxy).
7. **`browsers.profiles.id` cloud của `hrms-cmc`** — xác nhận sau khi tạo (để điền `--cloud-profile`).
8. ~~**Hướng dispatch queue→worker (blocker P0)**~~ — **RESOLVED: (a)** worker claim trực tiếp `automation.claim_next_job` (xem Phase 3).
9. **Cài đặt & chạy worker trên máy nào?** VPS này chưa có `tq`; thiết bị enroll `HNDW-NDTU6` là máy Windows.
