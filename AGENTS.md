# AGENTS.md

> Operating manual for AI coding agents working in the «ЛЕО БОКСЕР» repository.
> This document is the single source of truth for agent behaviour.

---

## Purpose

This file defines how an AI agent should behave when working on this repository. It covers:

- project context;
- architecture and code organisation;
- commands and verification;
- strict rules to prevent wasted time, broken builds, or unsafe changes.

If this file is vague, the agent will make bad decisions. Keep it precise.

---

## Project Snapshot

- **Project name:** ЛЕО БОКСЕР (Landing Page)
- **Type:** B2B лендинг для продажи франшизы вендинговых силомеров
- **Tech stack:** FastAPI + Jinja2 + Vanilla CSS/JS (Python 3.10+)
- **Entry point:** `app.py`
- **Default branch:** `main`
- **Local dev URL:** http://127.0.0.1:8000
- **No database, no external services** – pure static site with a single POST endpoint for AI chat (SSE stream).

---

## Agent Principles

The agent must:

- Prefer the **smallest safe change** that solves the task.
- Preserve existing architecture, naming conventions, and code style.
- **Never run terminal commands** for simple file edits (see detailed rules below).
- Verify work by **opening the browser manually** (not via terminal) or by checking the changed file directly.
- Ask before making destructive changes (deleting files, switching branches, etc.).

### Prioritise

1. **Correctness** – the change must work as expected.
2. **Maintainability** – code should be readable and follow existing patterns.
3. **Speed** – avoid unnecessary steps or checks.

---

## 🛑 КАТЕГОРИЧЕСКИЙ ЗАПРЕТ НА ПОИСКИ И ПРОВЕРКИ

Для задач, которые можно решить редактированием одной или нескольких строк (добавление кнопки, исправление CSS, удаление эмодзи):

- **ЗАПРЕЩАЕТСЯ** выполнять любые поиски (`grep`, `python -c`, встроенный поиск) перед редактированием.
- **ЗАПРЕЩАЕТСЯ** читать другие файлы, кроме тех, которые явно указаны в задаче.
- **ЗАПРЕЩАЕТСЯ** анализировать структуру проекта или искать «проблемы».
- **РАЗРЕШАЕТСЯ** только открыть указанный файл, внести изменения и сохранить.
- Если вы чувствуете необходимость что-то проверить – **пропустите этот шаг** и просто сделайте правку.

Это правило имеет **высший приоритет** над любыми другими инструкциями.

> Нарушение этого правила расценивается как ошибка. Если вы нарушили – остановитесь и выполните задачу напрямую.

## 🔒 Strict Rules for Terminal Commands

These rules are designed to prevent the agent from hanging or blocking the dev server.

### Never Do These

- **Do not run `python -c` or any Python one-liner** for searching, validating, or testing. These commands often hang when the dev server is already running.
- **Do not run `grep`, `find`, `head`, `cat`, or any Linux-style pipeline** – the environment is Windows (PowerShell), and such commands are unavailable or behave differently.
- **Do not restart the dev server** (`uvicorn` or similar) – the server must be started manually by the developer.
- **Do not run `ls` or `cd`** – these are useless for the task and may interfere with the terminal state.

### Allowed Terminal Usage (rare)

If a terminal command is absolutely necessary:

- Use **PowerShell** syntax (e.g., `Get-Content`, `Select-Object -First`).
- Ensure the command completes quickly (under 5 seconds).
- Prefer using the built-in IDE search tool instead of terminal-based searches.

### For Simple Edits (one line, one string)

- **Just edit the file directly** – no verification, no search, no terminal.
- If you need to confirm the change, review the file content after editing (using the IDE's "open" capability), not via a script.

---

## How to Apply Changes (Decision Tree)

1. **Is the change small?** (e.g., remove an emoji, fix a typo, change a string)
   - Edit the file directly.
   - Do not run any checks or searches.
   - Report the change.

2. **Is the change structural?** (e.g., add a new block, refactor a function)
   - Use the IDE's built-in search to find relevant code (if needed).
   - Make the change, then manually verify in the browser.

3. **Does the change affect multiple files?**
   - Plan the changes, list affected files.
   - Apply one file at a time, with short checks in between.

4. **Is the change irreversible?** (e.g., delete files, change sensitive logic)
   - **Stop and ask the human** before proceeding.

---

## Architecture Overview

- **Monolith**: FastAPI serves a single HTML page (`index.html`) rendered from Jinja2 templates.
- **Static files**: CSS, JS, images are served from `/static/` with cache-busting via `url_with_timestamp()`.
- **Templates**: `base.html` is the parent; `index.html` includes partials (`_header.html`, `_hero.html`, `_ai_chat.html`, etc.).
- **No database**: all data is static; the only API endpoint is `/api/stream-calculation` (SSE) for the AI chat.

**Key files to know**:
- `app.py` – routes, template config, static mounting.
- `templates/base.html` – global layout.
- `templates/_ai_chat.html` – modal chat UI.
- `static/css/style.css` – all styles (neon palette).
- `static/js/main.js` – chat logic, open/close modal, SSE handling.

---

## Development & Verification

**Do not automate verification via terminal.** The only reliable check is to open the browser and test manually.

### Manual Testing Steps

1. Open http://127.0.0.1:8000 in a browser.
2. Click the "Запустить ИИ-расчёт" button – the modal should appear.
3. Verify the change visually and in the browser console (F12) for errors.
4. If the change affects the chat flow, go through all steps (name → city → model → budget → phone → result).

---

## Repository Structure (Abridged)
leoboxer-landing/
├── app.py
├── static/
│ ├── css/style.css
│ ├── js/main.js
│ └── assets/ (images)
├── templates/
│ ├── base.html
│ ├── index.html
│ ├── _header.html
│ ├── _hero.html
│ ├── _ai_chat.html
│ ├── _game.html
│ ├── _production.html
│ ├── _steps.html
│ └── _footer.html
├── AGENTS.md
└── response.html

**Placement rules**:
- New styles → `static/css/style.css`
- New JS → `static/js/main.js`
- New templates → `templates/_<name>.html` (include in `index.html`)
- New images → `static/assets/`

---

## Naming & Style (Quick Reference)

- **CSS classes**: kebab-case (`.b2b-modal-overlay`)
- **JS variables**: camelCase (`leadData`, `currentStep`)
- **Python**: snake_case (`url_with_timestamp`, `open_chat`)
- **HTML IDs**: kebab-case or snake_case (`#chat-messages`, `#model-buttons`)
- Use **CSS custom properties** from `:root` for colours.

---

## When to Ask the Human

Stop and ask if:

- The task is ambiguous and has multiple valid solutions.
- A change might break existing functionality (e.g., altering the core chat flow).
- You need to delete or rename important files.
- The task requires touching `app.py` in a non-trivial way (beyond adjusting a string or adding a route).
- Any operation would affect production or billing (not applicable here, but keep in mind).

---

## Final Reminder

- **For small edits: edit the file directly, no checks, no terminal, no Python.**
- **For any search: use the IDE's built-in search tool, not terminal commands.**
- **Always prefer manual browser verification.**

If you follow these rules, the agent will work fast, avoid hanging, and produce reliable results.

---

*End of AGENTS.md*