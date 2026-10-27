# Quickstart Overview

**__PRODUCT__** is the agentic antidetect browser and CLI automation engine designed for AI agents, growth teams, and automation engineers to run multiple accounts without getting detected or banned.

> [!TIP] Command Architecture
> `tuquet` is the primary CLI command for browser profile lifecycle, stealth verification, and automation. Subcommands follow the canonical microservice domains (e.g. `tq browser launch`, `tq automation run`).

---

## What is an Antidetect Browser?

When you browse the internet, websites collect dozens of subtle tracking signals:
- **Hardware Parameters**: Graphic card renderer (WebGL), canvas noise, audio processor frequencies.
- **Network Parameters**: IP address, DNS servers, WebRTC local addresses.
- **Software Signatures**: Operating system, browser build, fonts, extensions, timezones, and screen resolution.

When multiple accounts share identical hardware fingerprints or IP addresses, security systems on platforms like Facebook, Google, Amazon, and TikTok immediately link the accounts and issue automated suspensions.

**Tuquet** solves this by generating a completely authentic, independent digital fingerprint for every profile you create. To the website, each profile looks like a brand-new physical computer located in your target region.

---

## 3-Minute Onboarding Path

1. **[Installation](/en/cli/start/installation)**: Install the native client in under 15 seconds.
2. **[Your First Profile](/en/cli/start/first-profile)**: Launch an isolated browser profile with a unique fingerprint and proxy.
3. **[Automa Workflow Automation](/en/automation/)**: Run automated tasks and workflows with a single command.
4. **[AI Agent Integration](/en/cli/skills/)**: Connect Claude, ChatGPT, or Cursor via native MCP.
5. **[Bridge & Proxy Setup](/en/gateway/)**: Connect SOCKS5 or HTTP proxies to mask your IP.

---

## Essential Commands Cheat Sheet

| Action | Canonical Command | Description |
| :--- | :--- | :--- |
| **Launch Default Profile** | `tq browser launch default` | Opens default isolated profile with CDP port |
| **Launch with Proxy** | `tq browser launch "Store-US" --proxy socks5://127.0.0.1:1080` | Routes browser network through SOCKS5 tunnel |
| **Launch in Headless Mode** | `tq browser launch "Scraper" --headless` | Runs browser invisibly in background |
| **List Profiles** | `tq browser profile list` | Inspects all local browser profiles & status |
| **Create New Profile** | `tq browser profile create "New-Profile"` | Generates unique deterministic fingerprint & sandbox |
| **Push Profile to Cloud** | `tq browser profile push <profile-id>` | Backs up profile archive to Cloudflare R2 |
| **Pull Profile from Cloud** | `tq browser profile pull <profile-id>` | Restores profile archive onto current workstation |
| **Verify Fingerprint / Turnstile** | `tq browser verify --url "https://..."` | Tests bot detection score & Cloudflare Turnstile |
| **Cloud & Desktop SSO Login**| `tq cloud login` | Authenticates with Central Control Plane via Desktop Bridge |
| **Check Environment Health** | `tq doctor` | Scans tools, runtimes & SSOT integrity |
| **Interactive Terminal Shell**| `tuquet` | Enters scoped interactive REPL environment |
