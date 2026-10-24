# TODO — HRMS Automation Workflow

> Cập nhật: **2026-10-24** · Nguồn: [`plan.md`](./plan.md) §14 + §15 · Task gốc: [`hrms-automation-workflow.md`](./hrms-automation-workflow.md)

## 🔜 Next (theo thứ tự ưu tiên)

1. **Phase 0b — Automa schema parity (engine)** — ưu tiên cao nhất: engine honour `trigger.data.parameters` + `{{secrets@name}}` + trigger mapping + publish-time validation; xoá cột `workflows.variables`. (task §9 Phase 1)
2. **Phase 2 — Re-author workflow HRMS trên canvas** — khai báo params ở `trigger.data.parameters`, bỏ fallback trong block, `{{secrets@name}}`.
3. **Phase 3 — Worker claim loop** — worker phải gọi `automation.claim_next_job` (hiện **0 caller** → queue là bảng chết); cài `tq` + enroll máy chạy job. **Chặn bởi quyết định #9.**
4. **Phase 5 — Cloud scheduling** — `pg_cron`/Edge Function materialize `automation.schedules` → `enqueue_job`; tạo schedule **08:00 VN T2–T6** (`0 8 * * 1-5`, `Asia/Ho_Chi_Minh`).
5. **Cột `idempotency_key`+`schedule_id`+`schedules.parameters`+`workflow_state`** trên `automation.jobs` — **cần owner duyệt schema change** (open item #1).
6. **Phase 6 — Observability & rollout** — audit + alert theo job; dry-run cho tenant; policy gate cho submit.

## ⚠️ Cần owner quyết

| # | Việc |
| --- | --- |
| 9 | Máy chạy worker (VPS chưa có `tq`; thiết bị enroll `HNDW-NDTU6` là **Windows**) |
| 1 | Duyệt schema change `automation.jobs.idempotency_key` |
| 6 | Profile `hrms-cmc`: dùng proxy hay không? |
| 3 | Mapping `reason_type` (mặc định `LOA_CORP_4`) |
| 4 | Kênh alert "không có ngày đủ điều kiện" |
| — | **Rotate mật khẩu HRMS** tại CMC (từng lộ trong git history cũ — repo `tuquet/runner`) |

## ✅ Đã xong (không làm lại)

- **Phase 0b engine parity** + **P0 (block fail-fast, schema enforce)** + **P1 (isDisabled/restartTimes/saveLog/root trigger/global_data)** — 2026-10-24, verify bằng chạy thật + 171 test.

- **Phase 0** — antidetect browser + profile `hrms-cmc-03e6b9` + login HRMS thật.
- **Phase 2** — workflow `HRMS Timesheet Review` (`a27093ce…`, 12 nodes) **dry-run chạy thật**: 28 ngày quét · 0 eligible · 17 `no_absence` · 3 `existing_request` · 1 `today_or_future`.
- **Phase 4** — Secret Store: 4A (engine + local) · 4B (cloud + device-portable) · UI console (`/secrets/credentials`) · hardening v2 (sealed DEK X25519 + client-side crypto + encrypted `.identity.json` + `tq secret rotate`).
- **Doctrine Automa schema** (chốt 2026-10-24): document = schema Automa, `{{secrets@name}}`, params ở `trigger.data.parameters`.
- **Cloud-first workflow store** — `public.workflow_*` RPC + CLI/console đọc cloud; local sqlite store đã xoá (§3.2c).
