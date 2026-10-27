---
name: google-developer-docs
description: Author technical documentation, runbooks, guides, and API specifications following the Google Developer Documentation Style Guide. Use when writing markdown docs, architectural specs, CLI manuals, or user-facing guides.
metadata:
  author: "@tuquet/skills"
  version: "2026.10.22"
---

# Google Developer Documentation Style Guide

This skill governs the voice, structure, terminology, and formatting of all technical documentation and specifications within Tuquet repositories, adhering strictly to the **Google Developer Documentation Style Guide**.

---

## 1. Voice and Tone Principles

- **Clear, Direct, and Objective**:
  - Avoid flowery language, hyperbole, marketing buzzwords, and fluff ("revolutionary", "lightning-fast", "ultra-powerful", "seamless").
  - Be specific and precise: state exact numbers, timeouts, network ports, algorithms, and specifications.
- **Active Voice**:
  - Write in active voice. Name the actor.
  - ✅ *"The gateway forwarder routes outbound packets through port 1080."*
  - ❌ *"Outbound packets are routed by the gateway forwarder through port 1080."*
- **Present Tense**:
  - Write in present tense, even for events that happen later.
  - ✅ *"When you run the command, the CLI spawns a detached Chromium process."*
  - ❌ *"When you run the command, the CLI will spawn a detached Chromium process."*
- **Second Person ("You")**:
  - Address the reader directly as "you". Avoid "we" or "the user".
  - ✅ *"You can configure the CDP port with the `--port` flag."*
  - ❌ *"We can configure the CDP port..."* or *"The user can configure..."*

---

## 2. Structure & Information Architecture

Technical documentation must be organized hierarchically:

1. **Title (H1)**: Single H1 per document describing the exact task or concept.
2. **Overview**: 1–2 paragraphs providing essential context: what it is, why it exists, and prerequisites.
3. **Task-Oriented Procedures**:
   - Numbered steps (1., 2., 3.) for sequential actions.
   - Every step starts with an imperative verb (*"Install the CLI"*, *"Verify the gateway status"*, *"Launch the test profile"*).
4. **Code & Command Blocks**:
   - Every command block must be complete and copy-pasteable.
   - Do NOT include prompt characters (`$`, `#`, `PS>`) inside copyable code blocks unless demonstrating output contrast.
5. **Reference / Configuration Tables**:
   - Tabulate options, environment variables, error codes, and parameters with types and defaults.

---

## 3. Formatting & Grammar Standards

- **Code Elements**:
  - Enclose commands, flags, file paths, variables, and HTTP codes in backticks: `` `tq browser launch` ``, `` `--cdp` ``, `` `127.0.0.1:1080` ``, `` `200 OK` ``.
- **Hyphenation & Case**:
  - Use kebab-case for CLI flags: `--skip-proxy-check`.
  - Use UPPERCASE for environment variables: `HTTP_PROXY`, `TQ_SESSION_DIR`.
  - Use sentence case for headings (capitalize only the first word and proper nouns).
- **Link Text**:
  - Make link text descriptive. Never use "click here" or "learn more".
  - ✅ *"Refer to the [Google Cloud CLI design guidelines](https://cloud.google.com/sdk).*"
  - ❌ *"To read the guidelines, click [here](https://cloud.google.com/sdk).*"

---

## 4. Alerts and Admonitions

Use GitHub-compatible callout blocks sparingly and for genuine necessity:

- `> [!NOTE]` : Relevant background context, architecture decisions, or edge-case behavior.
- `> [!IMPORTANT]` : Critical requirements or prerequisites needed to avoid failure.
- `> [!WARNING]` : Potential data loss, credential leakage, or network breakages.

Do NOT nest alerts or place consecutive alerts without intervening explanatory text.
