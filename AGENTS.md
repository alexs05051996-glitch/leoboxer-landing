# AGENTS.md

> Operating manual for AI coding agents working in the «ЛЕО БОКСЕР» repository.
> Every placeholder has been replaced with real project data.

---

## Purpose

This file is the primary operating manual for AI agents working in this repository.

It should give the agent enough context to:

- understand what the project does;
- follow the correct architecture and conventions;
- place code in the right directories;
- run the right commands for setup, validation, and testing;
- avoid unsafe or low-quality changes;
- know when to stop and ask a human.

If this file is vague, outdated, or contradictory, agent output will degrade. Keep it specific.

---

## Project Snapshot

- Project name: ЛЕО БОКСЕР (Landing Page)
- Project type: Web app (B2B-лендинг)
- One-line description: Продающий лендинг для франшизы коммерческих силомеров — вендинговых аппаратов для измерения силы удара.
- Primary users: Предприниматели, ищущие пассивный бизнес в сфере вендинга.
- Business/domain context: B2B-франчайзинг развлекательного вендинга. Ключевые УТП: «Бизнес без сотрудников», «Окупаемость от 6 месяцев», «Занимает 1 кв. метр», «Управление через телефон». Дизайн — премиальный, агрессивно-спортивный (референс: HOHORO).
- Lifecycle stage: MVP (активная разработка лендинга)
- Maintainers / owning team: alexs05051996-glitch
- Default branch: main
- Repo status notes: Активная разработка. Локальный сервер запущен и доступен по http://127.0.0.1:8000.

---

## Agent Principles

Unless the user explicitly asks otherwise, the agent should:

- prefer the smallest safe change that solves the task;
- preserve existing architecture and naming conventions;
- update tests when behavior changes;
- update docs, config, or examples when they become stale because of the change;
- verify work before finishing;
- avoid speculative refactors;
- ask before destructive, irreversible, expensive, or production-affecting operations.

### Optimize For

1. Correctness
2. Maintainability
3. Speed

### Never Do These By Default

- Rewrite architecture without being asked.
- Introduce a new dependency when an existing project dependency can solve the problem.
- Manually edit generated files if the intended workflow is regeneration.
- Ignore failing checks related to the files or behavior you changed.
- Guess around security-sensitive, billing-sensitive, or compliance-sensitive behavior.
- **Execute commands in the terminal** (`ls`, `cd`, `uvicorn`, `git`) when the terminal is already used for running the dev server — this causes conflicts and freezes the agent. The server must be started manually in a separate terminal by the developer.
- NEVER use Linux-specific command-line utilities or pipelines (such as 'head', 'grep', 'cat', 'clear', etc.). All validation or testing commands must be executed strictly using Windows PowerShell syntax (e.g., use 'Select-Object -First X' instead of 'head -X'). Prioritize manual verification in the browser or use native Python inline flags ('python -c') if verification is necessary.

---

## Sources Of Truth

Consult these references before making non-trivial changes:

| Source | Path / URL | When To Use It |
| --- | --- | --- |
| App entry point | `app.py` | Understanding routes, template config, static mounting |
| Base template | `templates/base.html` | Understanding page shell, asset loading, cache-busting |
| Rendered snapshot | `response.html` | Seeing the full rendered output of the landing page |
| Git remote | `https://github.com/alexs05051996-glitch/leoboxer-landing.git` | Pushing, pulling, reviewing history |

If documentation and code disagree, prefer **code** and mention the mismatch in your final summary.

---

## Tech Stack

Do not write "latest". Use exact versions or supported ranges.

### Core Stack

- Language(s): Python 3.10+
- Runtime(s): CPython 3.10+
- Framework(s): FastAPI (0.x), Jinja2 (3.1.6)
- Package manager(s): pip (no lockfile yet)
- Build tool(s): none
- Database(s): none (статический лендинг)
- Messaging / queueing: none
- Cache / storage: none (статический кэш-брейкинг через timestamp)
- Hosting / infrastructure: Local development (Windows 11), default terminal is STRICTLY PowerShell. Target deployment hosting — Linux/Docker VPS.

### Key Libraries And Services

| Area | Library / Service | Version | Purpose | Notes / Constraints |
| --- | --- | --- | --- | --- |
| Backend | FastAPI | 0.x | HTTP-сервер, роутинг, статика | Точная версия не зафиксирована (нет requirements.txt) |
| Backend | Uvicorn | 0.x | ASGI-сервер для запуска | Запуск: `uvicorn app:app --reload` на порту 8000 |
| Backend | Jinja2 | 3.1.6 | Серверный рендеринг шаблонов | Кэш шаблонов отключён из-за бага с нехешируемым ключом |
| Backend | python-multipart | 0.x | Парсинг форм (для будущих POST-эндпоинтов) | Точная версия не зафиксирована |
| Frontend | Vanilla CSS | — | Стили в `static/css/style.css` | Неоновая палитра: `--neon-blue: #00f0ff`, `--neon-pink: #ff2d75` |
| Frontend | Vanilla JS | — | Интерактивность (геймификация, формы) | `static/js/main.js` |

### Version Policy

- Required versions: Python 3.10+, FastAPI 0.x, Jinja2 3.1.6, Uvicorn 0.x
- Version source of truth: **отсутствует** — нет `requirements.txt` или `pyproject.toml`. Версии определяются установленным окружением.
- Dependency update policy: manual
- Compatibility requirements: современные браузеры (Chrome, Firefox, Safari, Edge последних 2 версий)

---

## Architecture

- Architecture style: Монолит (server-side rendered) с разделением на статику и шаблоны
- High-level description: FastAPI-приложение рендерит единственную страницу (index.html) через Jinja2. Статика (CSS, изображения) раздаётся через `StaticFiles`. Интерактивность — на Vanilla JS внутри шаблонов. Никакого фронтенд-фреймворка, API-слоя или базы данных нет.
- Main modules / bounded contexts: app (роутинг + шаблоны), static (CSS + изображения + JS), templates (Jinja2-паршалы)
- Main data flow: HTTP GET / → FastAPI route → Jinja2 render `index.html` → extends `base.html` → includes partials (`_header`, `_hero`, `_ai_chat`, `_game`, `_production`, `_steps`, `_footer`) → HTML-ответ
- State management approach: отсутствует (полностью stateless)
- Integration boundaries: `POST /api/chat` — заглушка для будущего ИИ-чата (возвращает `{"status": "ok"}`)
- Areas under migration: нет
- Hard constraints: `app.py` уже работает и настроен — не менять без явной задачи. Кэш Jinja2 отключён (`templates.env.cache = None`) — не включать обратно без проверки совместимости с Jinja2 3.1.6.

### Architectural Rules

- Вся бизнес-логика — в `app.py` (роуты, хелперы). Не создавать новых Python-модулей без явной задачи.
- Шаблоны — в `templates/`. Паршалы именуются с префиксом `_` (например, `_header.html`).
- Статика — в `static/`. CSS → `static/css/`, JS → `static/js/`, изображения → `static/assets/`. Все пути должны использовать `url_with_timestamp()` для кэш-брейкинга.
- При изменении CSS/JS — обновлять timestamp через `url_with_timestamp()` (автоматически, функция читает `os.path.getmtime`).
- Не дублировать логику из `app.py` в шаблоны и наоборот.
- Не добавлять новые зависимости без явной задачи и без фиксации в requirements.txt.

---

## Repository Structure

```text
leoboxer-landing/
├─ .gitattributes          # Git-конфигурация (LF-нормализация)
├─ AGENTS.md               # Этот файл (обновлён)
├─ app.py                  # Точка входа FastAPI: роуты, статика, Jinja2, url_with_timestamp
├─ response.html           # Пререндеренный снапшот главной страницы (для отладки)
├─ static/
│  ├─ css/
│  │  └─ style.css         # Все стили лендинга (неоновая палитра)
│  ├─ js/
│  │  └─ main.js           # Основной JS (интерактивность)
│  └─ assets/
│     ├─ bg-loft.png       # Фоновое изображение hero-секции (кирпичи)
│     ├─ logo.png          # Логотип «ЛЕО БОКСЕР»
│     ├─ telegram.svg
│     ├─ WhatsApp.svg
│     └─ Логотип_MAX.svg
└─ templates/
   ├─ base.html            # Базовый шаблон: <head>, подключение CSS с кэш-брейкингом
   ├─ index.html           # Главная страница: extends base, включает все паршалы
   ├─ _header.html         # Парящая стеклянная шапка с логотипом и навигацией
   ├─ _hero.html           # Главный экран: кирпичный фон, текст, контакты
   ├─ _ai_chat.html        # Блок «Умный расчёт прибыли» с формой ИИ-чата
   ├─ _game.html           # Игровая механика: виртуальный удар + лид-форма (с инлайн-JS)
   ├─ _production.html     # Блок «Собственное производство» с галереей
   ├─ _steps.html          # Пошаговый план запуска (4 шага)
   └─ _footer.html         # Футер: контакты, адрес, документы, соцсети

   Directory Responsibilities
Path	Responsibility	Typical Contents	Must Not Contain
static/css/	Стили	style.css	Серверная логика, шаблоны
static/js/	JavaScript-скрипты	main.js	CSS, изображения
static/assets/	Изображения, иконки, шрифты	*.png, *.jpg, *.svg	Код, стили
templates/	Jinja2-шаблоны	base.html, index.html, паршалы _*.html	Статика, Python-код
app.py	Роутинг, конфигурация шаблонов, хелперы	FastAPI app, url_with_timestamp, роуты	Шаблоны, статика
Корень	Мета-файлы и точка входа	.gitattributes, AGENTS.md, response.html	Исходники вне app.py
File Placement Rules
Новые секции лендинга → templates/_<name>.html + включить в templates/index.html.

Новые стили → static/css/style.css (единый файл, не дробить без задачи).

Новые изображения → static/assets/.

Новые JS-скрипты → static/js/.

Новые Python-модули → только с явной задачей, в корне или в пакете.

Env/config файлы → корень проекта (.env при появлении).

Environment Setup
Required Tooling
Required tools: Python 3.10+, pip

Install dependencies: pip install fastapi uvicorn jinja2 python-multipart (точного requirements.txt нет — установить основные пакеты вручную)

Start local environment: uvicorn app:app --reload (сервер на порту 8000)

Start dependent services only: none

Seed / bootstrap data: none

Load environment variables from: не требуется (переменные окружения не используются)

Required local services: none

Setup Notes
Никаких внешних сервисов (БД, Redis, очереди) не требуется.

Docker не требуется.

Сервер уже запущен вручную на http://127.0.0.1:8000. Не перезапускать без явной задачи, и никогда не запускать через агента — только вручную в отдельном терминале.

При первом клонировании: pip install fastapi uvicorn jinja2 python-multipart, затем uvicorn app:app --reload.

Development Commands
Task	Command	Scope	Notes
Install dependencies	pip install fastapi uvicorn jinja2 python-multipart	repo	requirements.txt отсутствует — установка вручную
Start development	uvicorn app:app --reload	repo	Запускает сервер на http://127.0.0.1:8000
Start one service/package	N/A	—	Монолит, один сервис
Build	N/A	—	Нет этапа сборки
Lint	не настроен	—	Линтер отсутствует
Format	не настроен	—	Форматтер отсутствует
Typecheck	не настроен	—	Python без type-checker
Run all tests	не настроен	—	Тесты отсутствуют
Run one test file	не настроен	—	Тесты отсутствуют
Run one test case	не настроен	—	Тесты отсутствуют
Run integration tests	не настроен	—	Тесты отсутствуют
Run e2e tests	не настроен	—	Тесты отсутствуют
Regenerate code	N/A	—	Кодогенерация не используется
Verification Strategy

Проверка выполняется вручную через открытие браузера. Автоматические запросы к серверу из командной строки запрещены.

Порядок проверки:

Открыть http://127.0.0.1:8000 в браузере, убедиться что страница рендерится без ошибок.

Проверить консоль браузера: отсутствие JS-ошибок, 404 на статику.

Проверка response.html не автоматизируется — только ручная.

Git diff: проверить, что изменения не затронули критичные участки app.py.

Testing Guide
Test framework(s): отсутствуют

Unit test location(s): отсутствуют

Integration test location(s): отсутствуют

E2E test location(s): отсутствуют

Contract test location(s): отсутствуют

Naming pattern(s): не применимо

CI workflow location: отсутствует

Testing Rules
Тесты не настроены. При добавлении тестов — использовать pytest.

Перед изменениями в app.py — вручную проверить рендер страницы через браузер.

При добавлении форм — проверить отправку и валидацию вручную.

Test Matrix
Test Type	Path / Scope	Command	When To Run
Manual smoke test	http://127.0.0.1:8000	Открыть в браузере	После любых изменений в шаблонах или app.py
Code Style And Naming
Formatter: не настроен (рекомендуется black при добавлении)

Linter: не настроен (рекомендуется ruff при добавлении)

Type policy: dynamic (без аннотаций типов, кроме стандартных)

Comments policy: комментарии на русском языке, описывают назначение блоков

Import policy: стандартные импорты Python, сгруппированные: стандартная библиотека → внешние пакеты

Error handling style: исключения FastAPI по умолчанию

Logging style: не настроен (используется print / console.log)

Configuration style: хардкод в app.py

Naming Conventions We Prefer
Item	Preferred	Avoid	Example
Files	snake_case (Python), kebab-case или snake_case (HTML/CSS)	mixedCase, пробелы	_ai_chat.html, style.css, bg-loft.png
Directories	lowercase, без пробелов	CamelCase, пробелы	static/, templates/
Classes / components	PascalCase (Python), kebab-case (CSS-классы)	snake_case для CSS	Jinja2Templates, .hero-section
Functions / methods	snake_case	camelCase	url_with_timestamp()
Variables	snake_case (Python), camelCase (JS)	смешанный стиль	strengthFill (JS), target_strength (Python)
Constants	UPPER_SNAKE (Python), CSS-переменные с --	—	--neon-blue, --bg-dark
Types / interfaces / schemas	не используются	—	—
Test names	не применимо	—	—
Branch names	не зафиксированы	—	—
Style Do / Don't
Do:

использовать имена, отражающие назначение;

сохранять модули связными и целенаправленными;

следовать уже существующим паттернам в проекте;

писать комментарии к секциям на русском языке;

использовать CSS-переменные из палитры :root для новых стилей.

Don't:

создавать «utils»-свалки для несвязанной логики;

смешивать стили именования в одной области;

скрывать важные побочные эффекты за расплывчатыми именами хелперов;

вводить широкие абстракции до появления второго реального кейса.

Preferred Patterns And Reference Implementations
Good Examples To Copy
app.py:16-20 (url_with_timestamp): хороший пример хелпера для кэш-брейкинга статики — чистый, без побочных эффектов.

templates/base.html: эталонная структура базового шаблона с подключением CSS через url_with_timestamp.

templates/_game.html:34-109: хороший пример инлайн-JS с анимацией на requestAnimationFrame и формой захвата лида.

Patterns To Avoid Copying
response.html: это пререндеренный снапшот, не шаблон. Не редактировать вручную — он перегенерируется из шаблонов.

Hero Section (Critical)
Hero-экран максимально простой: кирпичный фон (bg-loft.png), текстовый блок слева и контакты (телефон + иконки соцсетей) под текстом.

Правильная структура в _hero.html
html
<section id="hero" class="hero">
    <div class="container hero__container">
        <div class="hero__content">
            <div class="glass-card">
                <h1>...</h1>
                <p class="hero-subtitle">...</p>
                <button class="btn-hero-cta">Получить бизнес-план</button>
                <span class="hero-footnote">...</span>
            </div>
            <div class="hero-contacts">
                <a href="tel:..." class="hero-contacts-phone">8 (999) 999-99-99</a>
                <div class="hero-contacts-icons">...</div>
            </div>
        </div>
    </div>
</section>
Никаких canvas, львов, молний, mix-blend-mode и сложных визуальных эффектов на hero-экране.

Правильные CSS-стили
В .hero (корневой контейнер):

css
.hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    background: url('../assets/bg-loft.png') center / cover no-repeat;
    padding: 80px 5% 60px;
}
Не добавлять overflow: hidden, isolation: isolate, filter или transform на .hero — они не нужны и могут сломать отображение.

Адаптивность
На планшетах и мобильных (<1024px) текст и контакты центрируются:

css
@media (max-width: 1024px) {
    .hero__container {
        gap: 30px;
        justify-content: center;
    }
    .hero__content {
        flex: 1 1 100%;
        text-align: center;
    }
    .hero-contacts {
        margin-left: auto;
        margin-right: auto;
    }
}
Data, Contracts, Codegen, And Migrations
Schema location: не применимо (нет БД)

Migration location: не применимо

API contract location: app.py (роуты определены в коде)

Event contract location: не применимо

Generated code location: не применимо

Regeneration command: не применимо

Rules
Единственный API-контракт — POST /api/chat (заглушка). При расширении API — документировать в app.py.

response.html — генерируется сервером. Не редактировать вручную.

Security And Safety Boundaries
Hard Rules
Never commit secrets, private keys, access tokens, or production credentials.

Never hardcode secrets in source code, tests, fixtures, or documentation.

Redact sensitive values in logs and examples.

Validate and sanitize untrusted input at the proper boundary.

Use least privilege for database, cloud, and service credentials.

Be extra careful in code touching auth, billing, PII, legal/compliance, infrastructure, or permissions.

Human Approval Required Before
deleting data or files;

applying irreversible migrations;

changing auth or permission logic;

changing billing or payment flows;

changing deployment or production infrastructure;

installing or replacing major dependencies;

rotating secrets or changing security configuration.

Sensitive Areas
Authentication / authorization: отсутствует (открытый лендинг)

Payments / billing: отсутствует

Personal or regulated data: формы захвата лидов (_game.html:21-26) — имя, телефон, email. Передаются через POST /api/chat (заглушка). При реализации отправки — обеспечить HTTPS и защиту персональных данных.

Production configuration / infrastructure: не настроено

Git, PR, And Definition Of Done
Branch naming convention: не зафиксированы

Commit message convention: не зафиксированы

PR title convention: не зафиксированы

Changelog policy: не ведётся

Release notes policy: не применимо

Definition Of Done
A change is not complete until:

страница открывается в браузере по http://127.0.0.1:8000 без ошибок;

консоль браузера не содержит JS-ошибок и 404;

стили и вёрстка соответствуют макету (визуальная проверка);

file placement and naming follow this document;

assumptions, risks, and follow-up work are documented.

Monorepo Guidance
Не применимо — проект является монолитным лендингом. При разделении на несколько сервисов — создать вложенные AGENTS.md по схеме из шаблона.

Known Pitfalls
Кэш Jinja2 отключён (templates.env.cache = None в app.py:26). Не включать обратно — Jinja2 3.1.6 имеет баг с нехешируемым ключом при включённом кэше.

requirements.txt отсутствует. При добавлении новых зависимостей — создать requirements.txt через pip freeze > requirements.txt и закоммитить.

Порт 8000 — всегда проверять по http://127.0.0.1:8000.

Агент не должен запускать сервер или выполнять ls/cd в терминале, где уже запущен сервер — это вызывает конфликт и зависание. Сервер запускается вручную разработчиком в отдельном терминале.

When The Agent Must Stop And Ask
The agent should pause and ask a human when:

requirements are ambiguous and there are multiple valid implementations;

a change may break API compatibility, data compatibility, or deployment safety;

documentation and code materially disagree;

tests fail for reasons unrelated to the task and the cause is unclear;

the task requires secrets, production access, or product-policy decisions;

the safest path depends on a tradeoff the user has not chosen.

Optional Cross-Tool Alignment
If this repository also uses tool-specific AI instruction files, keep them aligned:

README.md

.github/copilot-instructions.md

CLAUDE.md

.cursorrules

.aider.conf.yml

.gemini/settings.json

Prefer one authoritative source and mirror only the minimum necessary.

Maintenance Checklist For Humans
Update this file whenever the architecture, stack, commands, or workflow change.

Keep commands executable exactly as written.

Replace vague placeholders with real values before rollout.

Add links to the best in-repo examples for common tasks.

Split this file into nested AGENTS.md files when one file becomes too broad.

Adoption Checklist
☑ All placeholder values in <angle_brackets> replaced;
☑ All example values copied from template replaced;
☑ All generic commands replaced with real commands;
☑ All generic paths replaced with real paths;
☑ All abstract rules replaced with project-specific rules;
☑ Project overview included;
☑ Stack and versions included;
☑ Architecture and boundaries included;
☑ Repository structure included;
☑ Exact setup/build/test commands included;
☑ Test locations and execution strategy included;
☑ Naming conventions included;
☑ Good and bad in-repo examples included;
☑ Security boundaries included;
☑ Escalation rules included;
☑ Links to source-of-truth documentation included.
text

---
