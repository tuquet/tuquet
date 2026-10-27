# Edge Error Relay

Cổng nhận **error telemetry** (Sentry-compatible envelope) và đẩy alert về Telegram qua **Cloudflare Worker** — chạy hoàn toàn ở edge, **0 RAM** trên VPS.

## Vì sao tồn tại

Các app client gửi lỗi tới DSN Sentry. Bot ChatOps chỉ long-poll Telegram nên **không có inbound HTTP**, và server có thể restart/down → alert thất lạc.
Worker này chạy ở Cloudflare Edge nên **luôn sẵn sàng**, nhận alert kể cả khi server chính gặp sự cố.

## Endpoint

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/`, `/health` | Health check → `{ "status": "ok" }` |
| `POST` | `/api/{projectId}/envelope/` | Nhận Sentry envelope → dedupe 60s → gửi alert Telegram |

## Bindings & Secrets

| Binding | Kiểu | Mô tả |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | **Secret** | Token bot Telegram |
| `TELEGRAM_CHAT_ID` | Variable | ID nhóm nhận alert |
| `WEBHOOK_SECRET` | **Secret** | Khóa bí mật dùng cho xác thực webhook (tùy chọn) |

> **Lưu ý bảo mật:** Không lưu trữ secret vào file trong source code. Toàn bộ secret được inject qua CLI Cloudflare.

## Hướng dẫn thiết lập & Triển khai

### 1. Cài đặt dependencies

```bash
pnpm install
# hoặc npm install
```

### 2. Thiết lập Secret bằng lệnh thuần (Interactive CLI)

Set từng secret trực tiếp qua CLI (nhập giá trị khi terminal hỏi prompt, không lưu ra file):

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put WEBHOOK_SECRET
```

Hoặc truyền giá trị inline qua pipe/stdin:

```bash
# Bash / Linux / macOS
echo "YOUR_TELEGRAM_BOT_TOKEN" | npx wrangler secret put TELEGRAM_BOT_TOKEN

# PowerShell (Windows)
"YOUR_TELEGRAM_BOT_TOKEN" | npx wrangler secret put TELEGRAM_BOT_TOKEN
```

### 3. Deploy Worker

```bash
npx wrangler deploy
```

Cấu hình DSN cho client SDK (Sentry / Bugsink):
```text
https://<public-key>@<worker-domain>/1
```

## Kế hoạch phát triển (TODO)

- [ ] Xác thực token/key đầu vào cho endpoint POST
- [ ] Bổ sung phân loại `level` (error, warning, fatal) vào nội dung tin nhắn Telegram
- [ ] Bộ lọc tùy chọn bỏ qua các log cấp độ `warning` hoặc `info`
