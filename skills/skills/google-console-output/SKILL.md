---
name: google-console-output
description: Enforce Google and Unix command-line output standards. Use when authoring CLI commands, designing console feedback, logging operational tasks, or formatting CLI stdout and stderr.
metadata:
  author: "@tuquet/skills"
  version: "2026.10.22"
---

# Google Console Output Engineering Standard

This skill establishes the standard for CLI terminal output across all Tuquet engineering tools, strictly aligned with **Google Cloud CLI (`gcloud`)**, **Google Shell Style Guide**, and **Unix Philosophy** (Rule of Silence, Rule of Separation).

---

## 1. Core Principles

1. **Rule of Silence (McIlroy's Unix Philosophy)**:
   - When a program has nothing surprising or critical to report, it should say nothing or emit a minimal, deterministic single-line confirmation.
   - Avoid banner screens, decorative ASCII frames, decorative boxes, and cheerleading copy on routine executions.
2. **Separation of Concerns (stdout vs stderr)**:
   - `stdout` is for **data and direct command results** intended to be consumed by pipelines, scripts, or parsed via flags.
   - `stderr` is for **diagnostics, operational progress, status updates, warnings, and errors**.
3. **Machine Readability First**:
   - Every CLI command outputting tabular data or structured results MUST support `--format json` or `--json`.
   - Mutation commands MUST support `--quiet` / `-q` to suppress non-essential status lines and only emit machine-parseable identifiers (e.g. PID, ID) to `stdout`.
4. **Zero Marketing / Enterprise Restraint**:
   - Never print marketing phrases ("*Next-gen ultra-secure engine*", "*Zero-Port Protection against localhost port scanning*", "*Connect your agent or automation script*").
   - Output must be purely technical, concise, unambiguous, and professional.

---

## 2. Output Taxonomy by Command Category

| Category | Verb Examples | Default Standard Output | Machine Flag (`--json` / `-q`) | Target Stream |
|---|---|---|---|---|
| **Mutations** | `create`, `launch`, `start`, `stop`, `delete` | Single-line declarative confirmation | `-q`: Output only resource identifier or PID.<br>`--json`: Emit JSON payload. | `stdout` |
| **Inspect** | `describe`, `inspect`, `show` | Clean key-value pairs (or 2-column table) | `--json`: Raw structured JSON | `stdout` |
| **List / PS** | `list`, `ps` | Plain tabular view with uppercase headers | `--json`: JSON array | `stdout` |
| **Long-Running** | `pull`, `build`, `sync` | Ephemeral single-line spinner or progress bar | Hidden if non-TTY or `--quiet` | `stderr` |
| **Diagnostics / Errors** | Failure conditions | Crisp error with root cause and actionable remediation | Exits non-zero, errors always to `stderr` | `stderr` |

---

## 3. Detailed Formatting Specifications

### A. Mutations (`create`, `launch`, `start`, `stop`, `delete`)

#### ❌ Anti-pattern (Overly decorative, verbose):
```text
  [ANTIDETECT BROWSER (ZERO-PORT STEALTH - DETACHED)] ● ZERO-PORT STEALTH
    Engine       : adryfish/fingerprint-chromium (v148.0.7778.215)
    Profile      : Acceptance-Profile [acceptance-profile-a0a177]
    Seed (PRNG)  : 1772134775 (Deterministic Hardware)
    CDP Port     : Disabled (Zero-Port Protection against localhost port scanning)
    Extensions   : 0 active extension(s)
    PID          : 26524
    Browser running in background. Connect your agent or automation script.
```

#### ✅ Google Standard Pattern (Clean, Single-line):
```text
Started browser [acceptance-profile-a0a177] (pid: 26524).
```
With CDP enabled:
```text
Started browser [acceptance-profile-a0a177] (pid: 26524, cdp: http://127.0.0.1:9222).
```
With `--quiet` or `-q`:
```text
26524
```
With `--format json` or `--json`:
```json
{
  "profile_id": "acceptance-profile-a0a177",
  "pid": 26524,
  "cdp_port": null,
  "status": "running"
}
```

### B. Deletions & Stop Operations

```text
Deleted profile [acceptance-profile-a0a177].
Stopped browser [acceptance-profile-a0a177] (pid: 26524).
```
If already stopped/absent and idempotent:
```text
Profile [acceptance-profile-a0a177] is already stopped.
```

### C. Errors and Actionable Diagnoses

All errors must be routed to `stderr`. Format errors with standard prefix `ERROR:` or `Error:` followed by the concise failure, root cause, and remediation hint.

```text
ERROR: (tq.browser.launch) Proxy unreachable: socks5://127.0.0.1:1080 (Connection refused).
- The configured proxy server is offline or port 1080 is closed.
- To bypass pre-flight check, re-run with '--skip-proxy-check'.
- Test proxy status with: tq proxy probe socks5://127.0.0.1:1080
```

---

## 4. Implementation Rules for Rust (`cli`)

1. **Use Direct Formatted Println for Mutations**:
   - Do NOT wrap routine single-action mutations in `clack_prompts` cards, `Card::new(...)`, or multi-line decorative borders.
   - Use `println!("Started browser [{}] (pid: {}).", profile_id, pid);`
2. **TTY Sensitivity**:
   - Check if stdout is a TTY (`std::io::stdout().is_terminal()`).
   - If not a TTY (piped to another command or file), strip all ANSI color sequences automatically.
3. **Respect `--quiet` / `-q`**:
   - In quiet mode, emit only the primary ID/PID or exit code 0 silently.
4. **Structured Output Priority**:
   - If `--json` flag is detected, serialize response with `serde_json` and print to `stdout` directly without any leading/trailing human strings.
