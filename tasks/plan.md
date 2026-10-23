# Kế hoạch: HRMS Automation Workflow trên Tuquet

> Nguồn: [`hrms-automation-workflow.md`](./hrms-automation-workflow.md) — task gốc đã được audit & chốt thiết kế.
> Trạng thái tổng: **Design locked / Ready for implementation** (v0 workflow đã tạo trên cloud).

## 1. Trạng thái

| Thuộc tính | Giá trị |
| --- | --- |
| Độ ưu tiên | P1 (tự động hoá nghiệp vụ HRMS, chạy trên workstation đã enroll) |
| Category | feature / automation |
| Effort dự kiến | 6 phase, ~5–8 ngày công |
| Depends on | `tq auth login` (đã có) · tenant admin `e0f30395-…` · workstation `HNDW-NDTU6` |
| Risk | Trung bình–cao (ghi dữ liệu thật lên HRMS; phụ thuộc session/browser profile) |
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
| Worker fleet transport | `worker/src/transport/ws_client.rs` | WS outbound tới control plane |
| CLI subcommands | `tq auth login` · `tq worker start/status/logs` · `tq automation run/inspect` · `tq browser profile *` | tất cả tồn tại |
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

## 4. Quyết định đã chốt

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

## 5. Phạm vi

**Trong phạm vi:** contract I/O của workflow · workflow template tái sử dụng · adapter HRMS fetch-based + mock test · chạy trên workstation fleet · enqueue + scheduler trên cloud · dry-run/submit/idempotency/audit · lưu status + logs · zero-secret.

**Ngoài phạm vi:** Chromium trong scheduler · thay `tq auth login` · engine browser mới · đa nhà cung cấp HRMS · submit trước khi dry-run được xác minh · lưu password plaintext.

## 6. Lộ trình

### Phase 1 — Adapter HRMS (domain contract)
- [ ] Model typed cho request/response HRMS API.
- [ ] Viết lại `tools/hrms/src/api.js` thành adapter **fetch-based**, worker-compatible (không dùng fs).
- [ ] Token inject qua auth provider; không đọc `~/.hrms/config.json`.
- [ ] Typed errors: auth / rate-limit / invalid-period / API-failure / duplicate.
- [ ] Mock test: employee detail, period, timesheet, submit.

**Verify:** adapter chạy được ở Node + runtime worker; không log password/JWT; lỗi API kèm status + message an toàn; mock test pass.

### Phase 2 — Workflow Automation
- [ ] Workflow `hrms-timesheet-review` (đã có v0 draft trên cloud — tinh chỉnh).
- [ ] Validate biến đầu vào (`period`, `mode`, `minLateMinutes`, `maxLateMinutes`, `excludeDates`).
- [ ] Session check → lấy period + timesheet → phân tích `absent_time` → filter existing/excluded.
- [ ] Guard current workday (bỏ `date >= today`).
- [ ] Nhánh `dry-run` + nhánh `submit` (policy-gated).
- [ ] Timeout + cancellation.

**Verify:** `tq automation inspect hrms-timesheet-review` pass; chạy local với profile test; dry-run không mutate; submit tắt được bằng policy.

### Phase 3 — Workstation browser & worker
- [ ] Tài liệu setup workstation bằng `tq auth login`.
- [ ] Tạo/import profile `hrms-cmc` + **login tay 1 lần**.
- [ ] Worker chạy **fleet mode** (`tq worker start --cloud`) claim qua `claim_next_job`.
- [ ] Stream log → `automation.execution_logs`; result → `job.result_summary`.

**Verify:** workstation nhận job không cần tương tác; chạy đúng profile; restart worker không tạo đơn trùng; cancel dừng an toàn.

### Phase 4 — Auth & secret
- [ ] Tách Cloud auth khỏi HRMS auth.
- [ ] HRMS auth = browser profile đã login (không lưu password).
- [ ] JWT đọc từ profile (in-memory) → truyền cho adapter.
- [ ] Headless re-login = recovery path thủ công.
- [ ] Không đưa password/JWT/Authorization vào payload/log/audit.
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

## 7. First slice (làm trước, không phụ thuộc Phase 5)

1. Workstation `tq auth login` đã chạy.
2. Thêm `hrms-timesheet-review` ở chế độ **dry-run**.
3. Chạy **local** trên workstation + profile `hrms-cmc`.
4. Trả plan có cấu trúc (eligible/skipped).
5. **Chưa** submit.
6. **Chưa** thêm Cloud scheduler cho tới khi job local chạy được.

## 8. Lệnh cần dùng

```powershell
tq auth login
tq browser profile list
tq worker status
tq automation inspect hrms-timesheet-review
# LƯU Ý: `run` nhận ĐƯỜNG DẪN FILE làm positional đầu, không phải id workflow.
#         Xác nhận flag chạy workflow đã lưu theo id trước khi dùng.
tq automation run <path>.workflow.json --headless --timeout 300
tq worker start --cloud      # fleet mode
tq worker logs -f
```

## 9. Done criteria

- Workflow chạy được end-to-end trên workstation đã enroll, dry-run không mutate HRMS.
- Cron tạo job qua `automation.jobs`, không chạy browser/Node trong scheduler.
- Zero secret trong payload/log/audit; idempotent trước mọi request mutate.
- Có audit + alert; submit bật được/tắt được bằng policy.
- `cargo check`/`cargo test` sạch; không `cargo build --release` trên VPS.

## 10. STOP conditions

- Nếu thao tác HRMS cần DOM flow mà API không đủ → dừng, chốt lại Q1 (hybrid vs CDP).
- Nếu schema change `automation.jobs` bị từ chối → không tự ý sửa; chờ duyệt.
- Nếu session profile không tái sử dụng được → dừng, xin quyết định credential.
- Không `git push` / không trigger CI/CD trừ khi được yêu cầu (invariant #5).

## 11. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
| --- | --- | --- |
| Ghi đơn trùng lên HRMS | Cao | idempotency key + check `Pending/Approved` + dry-run trước |
| JWT hết hạn giữa chừng | Trung bình | Detect expiry, fail an toàn, re-login thủ công |
| Vỡ khi HRMS đổi API | Trung bình | Typed adapter + mock test; fail-fast |
| Hiểu sai `absent_time` vs lateness | Trung bình | Chỉ dùng `absent_time` server |
| Bật submit quá sớm | Cao | Policy gate + owner approval |

## 12. Open items

1. Cột `idempotency_key` trên `automation.jobs` — **cần owner duyệt schema change**.
2. Flag CLI chạy workflow đã lưu theo id — cần xác nhận.
3. Mapping `reason_type` (mặc định `LOA_CORP_4`, có cần thêm?).
4. Kênh alert "không có ngày đủ điều kiện".
5. Đồng bộ workflow cloud (`a27093ce-…`) về máy để chạy local (CLI đọc SQLite local).
