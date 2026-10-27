---
name: google-cli-command
description: Design CLI command hierarchies, flags, and ergonomics following Google Cloud SDK and POSIX/GNU guidelines. Use when authoring CLI interfaces, naming subcommands, structuring flags, and designing help text.
metadata:
  author: "@tuquet/skills"
  version: "2026.10.22"
---

# Google CLI Command Ergonomics & Design Standard

This skill establishes the architectural and grammatical standards for CLI interfaces across Tuquet tools, modeled after **Google Cloud CLI (`gcloud`)**, **Kubernetes CLI (`kubectl`)**, and **POSIX/GNU CLI Guidelines**.

---

## 1. Command Syntax Hierarchy: `[tool] [group] [subgroup] [action] [target] [flags]`

CLI commands MUST adhere to a strict noun-verb grammar:

```
tq <group> [<subgroup>] <action> [<target>] [flags]
```

### Examples:
- `tq browser launch acceptance-profile-a0a177 --cdp`
- `tq browser list --filter="status:running"`
- `tq gateway start --http`
- `tq gateway probe`
- `tq workflow run acceptance-smoke`

### Anti-patterns:
- ❌ Verb first: `tq launch-browser <id>` (breaks modular grouping).
- ❌ Inconsistent casing: `tq browser LaunchProfile` or `tq browser launch_profile`.
- ❌ Mixed plurals: `tq browsers list` vs `tq browser create` (Use singular noun `browser` consistently for command group).

---

## 2. Standard Action Verbs

Adopt standard Google CLI action verbs across all commands:

| Verb | Semantics | Idempotent |
|---|---|---|
| `list` | Print a list of matching resources (supports pagination/filter). | Yes |
| `describe` / `inspect` | Show detailed configuration and runtime state of a single resource. | Yes |
| `create` | Provision a new resource record or configuration. | No (fails if exists unless `--upsert`) |
| `update` | Mutate specific attributes of an existing resource. | Yes |
| `delete` | Destroy or de-provision a resource. | Yes |
| `start` / `launch` | Execute / spin up an instance (process or container). | Conditional |
| `stop` | Gracefully terminate an active instance. | Yes |
| `restart` | Stop then start an instance. | No |
| `status` | Query health and connection state of a subsystem. | Yes |
| `probe` | Actively test connectivity or perform diagnostic health-check. | Yes |

---

## 3. Flag Naming & Semantic Standards

1. **Kebab-case Always**:
   - `--skip-proxy-check`, `--no-sandbox`, `--user-data-dir`.
   - Never use camelCase (`--skipProxyCheck`) or snake_case (`--skip_proxy_check`).
2. **Boolean Flags & Negations**:
   - Positive flag: `--sync` (default: false or configurable).
   - Invert with `--no-`: `--no-sandbox`, `--no-sync`.
   - Never create opposing flags like `--sync` and `--disable-sync`.
3. **Universal Common Flags**:
   - `--help`, `-h`: Display command synopsis, flags, and examples.
   - `--version`, `-V`: Print tool version.
   - `--quiet`, `-q`: Suppress non-essential output (ideal for scripting).
   - `--format <format>` / `--json`: Specify output format (`json`, `yaml`, `text`, `table`).
   - `--verbose`, `-v`: Output debug traces and HTTP/RPC wire logs to `stderr`.

---

## 4. Help Text & Self-Documentation Standard

Every command must render structured `--help` output with:
1. **USAGE**: Exact invocation pattern.
2. **DESCRIPTION**: One or two clear sentences describing what the command does.
3. **ARGUMENTS**: Positional arguments with constraints.
4. **FLAGS**: Alphabetized options with defaults documented.
5. **EXAMPLES**: 2-3 copy-pasteable real-world examples with realistic values.

```text
USAGE:
    tq browser launch <PROFILE_ID> [FLAGS]

DESCRIPTION:
    Launch an antidetect browser session using the specified hardware profile.

ARGUMENTS:
    <PROFILE_ID>    Identifier or alias of the target profile.

FLAGS:
    --cdp                 Enable Chrome DevTools Protocol (CDP) debugging port.
    --port <PORT>         CDP port number [default: 9222].
    --skip-proxy-check    Bypass network pre-flight verification.
    -q, --quiet           Suppress status output and emit only PID.
    --json                Output launch metadata as JSON.
    -h, --help            Print help information.

EXAMPLES:
    # Launch browser profile with default stealth
    tq browser launch acceptance-profile-a0a177

    # Launch with CDP attached on custom port
    tq browser launch acceptance-profile-a0a177 --cdp --port 9225
```
