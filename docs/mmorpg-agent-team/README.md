# Wuxia MMORPG multi-agent coordination — setup (NOT deployed)

This directory stages a **project-management framework only**. It does not authorize deleting or rebuilding Game 2, Game 3D World, or any other existing Atom XE game. Target game, repository, and blueprint adoption require explicit owner decisions.

## Ownership and chats
**Owner → Communication/Intake → Project Manager → Architect + Specialists → Independent QA → PM integration review → Owner approval.**

Use one **independent ChatGPT chat** for each role: PM, Intake, Architect, Combat/Weapons, Factions/PvP, Items/Forge, Mount/Soul, Stats/Halos, Economy/Marketplace, Multiplayer/Backend, UI, QA/Security, Release, and World/Lore.

Chats **do not automatically communicate**. Shared GitHub issues, task packets, commits, pull requests and reports are the handoff source of truth. Do not claim another chat was notified without explicit verified posting or manual owner handoff. Fully automatic multi-agent dispatch requires a separate API orchestration runtime.

## Required process
1. PM confirms game target and inventories existing code first (TASK-000).
2. Architect maps the uploaded MMORPG blueprint onto existing code, preserving card progression differences until approved.
3. PM distributes non-overlapping work tasks and agents return written reports with commit SHA, tests and blockers.
4. QA independently checks evidence and acceptance criteria.
5. User authorizes any destructively scoped migration, branch merge or live release.

Read existing repository root `CLAUDE.md` **before any work**; preserve its Game 2 restrictions. Companion starter kit contains 14 agent prompt files and 14 Claude Code skills for the owner to open/install. This directory records the protocol while the exact game target is pending.
