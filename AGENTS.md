# Trellis Instructions

These instructions are for AI assistants working in this project.

This project is managed by Trellis. The working knowledge you need lives under `.trellis/`:

- `.trellis/workflow.md` — development phases, when to create tasks, skill routing
- `.trellis/spec/` — package- and layer-scoped coding guidelines (read before writing code in a given layer)
- `.trellis/workspace/` — per-developer journals and session traces
- `.trellis/tasks/` — active and archived tasks (PRDs, research, jsonl context)

If a Trellis command is available on your platform (e.g. `/trellis:finish-work`, `/trellis:continue`), prefer it over manual steps. Not every platform exposes every command.

If you're using Codex or another agent-capable tool, additional project-scoped helpers may live in:
- `.agents/skills/` — reusable Trellis skills
- `.codex/agents/` — optional custom subagents

Managed by Trellis. Edits outside this block are preserved; edits inside may be overwritten by a future `trellis update`.

<!-- TRELLIS:END -->

## Project Overview

* The current project is a `Vue 3 + TypeScript + Vite + Element Plus` frontend application.
* The current refactoring goal is to adapt to RuoYi backend capabilities, with the reference project located at `~/Code/Vue3/RuoYi-Vue3`.
* The reference scope is limited to domain models such as business logic, API contracts, data structures, dictionaries, permissions, and menus.
* Do not reference the technical stack choices, engineering setup, legacy component wrappers, or page implementation patterns from the RuoYi frontend project.
