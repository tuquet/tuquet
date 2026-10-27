# CLI Commands Catalog

The `tq` CLI is architected around **6 focused command families** and an AI Agent MCP gateway. Every command provides sub-millisecond execution, structured JSON output via `--json`, and interactive diagnostics.

---

## 1. `tq auth` — Cloud Identity & Multi-Tenancy

Manages operator credentials, device authorization, and multi-tenant workspace switching.

```bash
tq auth <subcommand> [options]
```

### Subcommands & Options

| Command | Arguments / Flags | Description |
| :--- | :--- | :--- |
| `tq auth login` | `--otp <code>`, `--token <jwt>`, `--email <addr>` | Authenticate operator session via interactive prompt or token |
| `tq auth logout` | `--all` | Revoke local stored session and purge active device tokens |
| `tq auth whoami` | `--json` | Display current authenticated user, active tenant ID, and pairing status |
| `tq auth tenant list` | `--json` | List all organizations/tenants accessible to the current operator |
| `tq auth tenant switch <id>` | `<tenant-id>` | Switch the active workspace tenant context |
| `tq auth tenant current` | `--json` | Print the current active tenant UUID |

---

## 2. `tq worker` — Distributed Compute Daemon

Autonomous background worker engine responsible for cloud fleet polling, workflow execution, and telemetry streaming.

```bash
tq worker <subcommand> [options]
```

### Subcommands & Options

| Command | Arguments / Flags | Description |
| :--- | :--- | :--- |
| `tq worker start` | `--daemon`, `--port <port>` | Start the local worker daemon process (default port: `9090`) |
| `tq worker worker` | `--poll-interval <sec>` | Run as an autonomous fleet worker executing jobs from Supabase Cloud |
| `tq worker stop` | `--graceful` | Send graceful shutdown signal to running worker daemon |
| `tq worker restart` | — | Gracefully restart the active worker process |
| `tq worker status` | `--json` | Inspect worker health, PID, process tree, and cloud sync status |
| `tq worker logs` | `-f` (tail), `-n <lines>` | Stream worker execution logs and telemetry events in real time |
| `tq worker probe` | `--json` | Probe local worker capabilities and return runtime manifest JSON |
| `tq worker config` | `--edit`, `--show` | Display, inspect, or edit worker configuration (`~/.tq/automation/worker.json`) |

---

## 3. `tq automation` — Workflow Orchestration Engine

Validates, executes, and coordinates headless browser automation workflows with Zero-Extension CDP stealth.

```bash
tq automation <subcommand> [options]
```

### Subcommands & Options

| Command | Arguments / Flags | Description |
| :--- | :--- | :--- |
| `tq automation run <path/id>` | `--headless`, `--browser <id>`, `--vars <k=v>` | Execute an automation workflow by JSON path or stored database ID |
| `tq automation workflow list` | `--json` | List stored automation workflows in the local database or cloud vault |
| `tq automation workflow info <id>` | `<id>` | Display detailed metadata and steps of a stored workflow |
| `tq automation inspect <file>` | `<file.json>` | Validate workflow JSON syntax, schema compliance, and action blocks |
| `tq automation studio` | `--port <port>` | Launch the visual Automa Web Studio in the default system browser |
| `tq automation probe` | `--json` | Probe automation engine capabilities, active plugins, and execution blocks |
| `tq automation config` | `--edit`, `--show` | Display or edit Automa configuration (`~/.tq/automation/automation.json`) |

---

## 4. `tq gateway` — Network Mesh & Proxy Supervisor

Controls the encrypted VPS tunnel mesh, embedded HTTP forwarder, and WebRTC leak shield.

```bash
tq gateway <subcommand> [options]
```

### Subcommands & Options

| Command | Arguments / Flags | Description |
| :--- | :--- | :--- |
| `tq gateway start` | `--http`, `--ssh`, `[server-id]` | Start SOCKS5 dynamic proxy (`1080`) and embedded HTTP forwarder (`8118`) |
| `tq gateway stop` | `[server-id]` | Gracefully stop running gateway tunnels and proxy daemons |
| `tq gateway status` | `--json` | Display health dashboard of all configured VPSs, ports, and workloads |
| `tq gateway probe` | `--target <url>`, `--json` | Probe egress connectivity, latency, public IP, and WebRTC leak protection |
| `tq gateway check` | — | Validate gateway configuration schema (`~/.tq/gateway/gateway.json`) and keys |
| `tq gateway enable <server>` | `<server-id>` | Enable a VPS node in the gateway mesh configuration |
| `tq gateway disable <server>` | `<server-id>` | Disable a VPS node without deleting its configuration credentials |
| `tq gateway config` | `--edit`, `--show` | View or edit canonical gateway configuration (`~/.tq/gateway/gateway.json`) |

---

## 5. `tq browser` — Anti-Detect Browser Runtime & Sandbox

Controls dedicated stealth Chromium instances, deterministic hardware PRNG seeds, and profile storage.

```bash
tq browser <subcommand> [options]
```

### Subcommands & Options

| Command | Arguments / Flags | Description |
| :--- | :--- | :--- |
| `tq browser install [engine]` | `[148]` | Download and provision isolated Chromium / Golden LTS runtime binaries |
| `tq browser status` | `--json` | Inspect installed browser engines and active sandboxes |
| `tq browser launch <profile>` | `--headless`, `--url <url>` | Launch browser profile with assigned fingerprint, hardware spoofing & proxy |
| `tq browser ps` | `--json` | List active browser processes, assigned CDP debugging ports, and PIDs |
| `tq browser stop [pid/id]` | `--force` | Terminate running browser instances gracefully |
| `tq browser profile list` | `--json` | List all local and cloud browser profiles |
| `tq browser profile create <name>` | `--proxy <url>`, `--ua <str>` | Create an anti-detect profile with unique hardware seeds & proxy binding |
| `tq browser profile delete <id>` | `<id>` | Delete local browser profile and purge sandbox cache |
| `tq browser profile test-proxy <id>` | `<id>` | Test proxy connectivity, latency, IP rotation, and WebRTC leak for profile |
| `tq browser ext list` | — | List installed Chrome extensions in the browser sandbox |

---

## 6. AI Agent MCP Protocol Bridge (`tq mcp`)

Exposes all Tuquet engine capabilities to AI coding agents (such as Antigravity, Claude Code, Cursor) via the standard Model Context Protocol.

```bash
tq mcp
```

- **Protocol**: JSON-RPC 2.0 over `stdio`.
- **Exported Tools**: `status`, `workflow_list`, `workflow_inspect`, `workflow_run`, `runner_probe`, `cloud_whoami`, `browser_status`, `faker_generate`, `inbox_otp`, `inbox_status`.

---

## 7. `tq secret` — Encrypted Secret Store

Tenant-scoped encrypted credential store. Values are referenced in workflows as `\{\{secrets.<name>\}\}` and **never** persisted in the workflow graph, job payload, or logs.

```bash
tq secret <subcommand> [options]
```

### Subcommands & Options

| Command | Arguments / Flags | Description |
| :--- | :--- | :--- |
| `tq secret init` | — | Create the local store key + device X25519 keypair |
| `tq secret set <name> <value>` | `<name>`, `<value>` | Store/update a secret (AES-256-GCM at rest) |
| `tq secret list` | `--format json` | List secret names (values are never printed) |
| `tq secret rm <name>` | `<name>` | Remove a local secret |
| `tq secret remote` | — | List secrets stored in Cloud (names only) |
| `tq secret push` | — | Register device key, then upload **client-side encrypted** secrets |
| `tq secret pull` | — | Receive the sealed DEK, fetch ciphertext, decrypt locally (no re-entry) |
| `tq secret rotate` | — | Rotate the tenant DEK (re-encrypts values, re-seals for all devices) |
| `tq secret path` | — | Print the local store path |

> See [`SPEC-secret-store`](/en/cloud/specs/SPEC-secret-store) for the envelope-encryption model (Vault KEK → per-tenant DEK) and device-portable provisioning.
