# Tuquet Workspace

> Root workspace and monorepo orchestration super-repository for the Tuquet Autonomous Agent Ecosystem.

Official Documentation: **[https://docs.tuquet.com/](https://docs.tuquet.com/)**

---

## 🏛️ Ecosystem Submodules (Core Pillars)

| Submodule | Description |
|---|---|
| [`cli`](cli) | Rust master control CLI (`tq`), local runner daemon, MCP bridge, and nested crates ([`faker`](cli/crates/faker)) |
| [`browser`](browser) | C++ stealth Chromium runtime, antidetect fingerprint spoofing |
| [`worker`](worker) | Distributed worker node and kernel process supervisor |
| [`cloud`](cloud) | Supabase PostgreSQL 15+ control plane, multi-tenant isolation |
| [`admin`](admin) | Cross-platform administration portal & desktop application |
| [`docs`](docs) | Documentation Single Source of Truth (SSOT) |
| [`lib`](lib) | Reusable Vue 3 UI primitives & design system |
| [`bot`](bot) | Telegram ChatOps daemon |
| [`skills`](skills) | Curated AI agent skills and runbooks |
| [`tuquet.com`](tuquet.com) | Main landing page |
| [`yak-map`](yak-map) | Interactive architecture graph visualizer |

---

## 🚀 Workspace Setup

Clone with all submodules:

```bash
git clone --recurse-submodules https://github.com/tuquet/tuquet.git
```

Update all submodules:

```bash
git submodule update --init --recursive
```

---

## 🛠️ VS Code Orchestration

Open the workspace in VS Code:

```bash
code tuquet.code-workspace
```

Press `Ctrl + Shift + B` to trigger fast local dev installation of `tq.exe` in ~2 seconds.

---

## License

[MIT](LICENSE) © Tuquet
