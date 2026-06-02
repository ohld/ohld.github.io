---
slug: kak-pravilno-pisat-skilly-claude-code-7-oshibok
lang: ru
title: Claude Code skills: 7 ошибок в SKILL.md
description: Как писать Claude Code skills без prompt soup: триггер, границы, output format, supporting files, tests/evals и skill pack, который агент реально вызывает.
publishedAt: 2026-02-10
updatedAt: 2026-06-02
readingTime: 15 мин
tags: AI Agents, Claude Code, Skills, MCP
coverImage: /assets/articles/kak-pravilno-pisat-skilly-claude-code-7-oshibok/claude-code-skills-cover.webp
coverAlt: Мем-обложка SKILL.md / NOT PROMPT SOUP для статьи про Claude Code skills
sourceTelegramId: 0
primaryKeyword: claude code skills
secondaryKeywords: скиллы claude code; claude code агенты; claude code agents; skill.md; ai agent skill pack; claude code mcp servers; как добавить скилл в claude code; claude code skills github
views: 0
forwards: 0
comments: 0
reactions: 0
---

Хороший skill для Claude Code -- это не длинный промпт на 200 строк. Это маленькая операционная процедура: когда загружать, что делать, какие файлы читать, где остановиться, как проверить результат и в каком формате вернуть ответ.

Я обновляю эту старую заметку, потому что тема уже не выглядит как игрушка для power users. В локальной SEO-выгрузке за 24.04.2026 - 24.05.2026 отдельный кластер `Claude Code skills/agents` дал 4765 запросов. Топ: `claude code skills` -- 1188, `claude code агенты` -- 599, `claude code agents` -- 428, `скиллы claude code` -- 307. Люди ищут не философию, а нормальную инструкцию: как написать `SKILL.md`, который агент реально будет вызывать.

## Короткий ответ

Claude Code skill -- это папка с `SKILL.md` и, если нужно, supporting files: примерами, шаблонами, scripts, reference docs. В официальных [Claude Code docs](https://code.claude.com/docs/en/skills) skills описаны как способ расширить возможности Claude: агент видит имя и `description`, а полный body грузит только когда skill релевантен или когда ты вызываешь его руками через `/skill-name`.

Это важная разница. `CLAUDE.md` -- общий контекст проекта. Skill -- повторяемый workflow. Если ты третий раз вставляешь в чат один и тот же чеклист, команду деплоя, формат ревью, правила ресерча или критерии качества, это уже кандидат на skill.

## Что такое Claude Code skills

В Claude Code skill живет в директории:

```text
~/.claude/skills/<skill-name>/SKILL.md
.claude/skills/<skill-name>/SKILL.md
```

Первый путь -- личный skill для всех проектов. Второй -- project-specific skill, который лежит рядом с кодом и работает только в этом репозитории. Для меня project skills обычно ценнее: они фиксируют реальный workflow команды или проекта, а не абстрактную "полезную привычку".

Минимальный `SKILL.md` выглядит так:

```markdown
---
name: deploy-coolify
description: Use when the user asks to deploy this app through Coolify, restart a service, inspect deployment logs, or verify a production release.
---

## Goal

Deploy the current app through Coolify and verify that production is healthy.

## Workflow

1. Check git status and current branch.
2. Run the project's build or smoke command.
3. Trigger Coolify deployment.
4. Read deployment logs until the service is healthy.
5. Open the production URL and verify the changed route.

## Stop and ask

- If there are uncommitted user changes not related to the deploy.
- If secrets or credentials are missing.
- If production logs show a new error after deployment.

## Output format

Return:
- deployed commit
- production URL
- checks performed
- remaining risks
```

Тут нет магии. Но есть четыре вещи, которых почти всегда не хватает в плохих skills: trigger, workflow, stop conditions, output format.

## Skill, CLAUDE.md, command и agent -- не одно и то же

Самая частая путаница: люди пытаются засунуть в один файл всё. И получают простыню, которую Claude либо не грузит, либо грузит не туда, либо использует как общий vague advice.

| Что | Для чего | Когда использовать |
| --- | --- | --- |
| `CLAUDE.md` | Общие правила проекта, структура, запреты, стиль работы | Агенту это нужно почти всегда в этом проекте |
| Skill | Повторяемая процедура или специализированная экспертиза | Нужна только в конкретном классе задач |
| Command | Ручной вызов конкретного действия | Ты хочешь явно написать `/deploy` или `/review` |
| Subagent | Отдельная роль или изолированный контекст | Нужна параллельная работа, ревью, ресерч или длинный контекст |
| MCP | Доступ к внешним системам | Агенту нужен Telegram, Dune, GitHub, Coolify, browser, база |

Мой простой тест: если инструкция отвечает на вопрос "как устроен проект?", клади в `CLAUDE.md`. Если отвечает "как выполнять эту повторяемую задачу?", делай skill. Если нужен внешний сервис, подключай [MCP](/topics/mcp/). Если нужен отдельный работник с другим контекстом, заводи subagent.

Подробнее про связку `CLAUDE.md`, MCP, hooks и skills я писал в [моём сетапе Claude Code 2026](/claude-code-nastrojka-mcp-hooks-skills-2026/). Эта статья -- более узкий разбор именно про skills.

## 7 ошибок, из-за которых skill не работает

Старая версия этой статьи была почти только чеклистом. Он всё ещё правильный, но теперь я бы объяснял каждую ошибку через то, как Claude выбирает и использует skill.

### Ошибка 1. Нет нормального триггера

Плохой trigger:

```yaml
description: Helps with deployment.
```

Это не trigger, это вода. Claude не понимает, когда именно грузить skill: при деплое? при настройке деплоя? при падении CI? при чтении логов?

Нормальный trigger:

```yaml
description: Use when the user asks to deploy the app through Coolify, restart a Coolify service, inspect deployment logs, or verify production after a release.
```

Да, длиннее. Но это полезная длина. `description` -- главный resolver для skill. Если он расплывчатый, skill будет либо молчать, либо лезть в каждую вторую задачу.

### Ошибка 2. Нет глаголов действия

Фраза "работает с файлами" ничего не говорит агенту. Хороший skill должен использовать action verbs: `create`, `analyze`, `convert`, `deploy`, `verify`, `summarize`, `compare`, `extract`, `publish`, `rollback`.

Плохо:

```text
This skill works with SEO articles.
```

Нормально:

```text
Use this skill to turn a source pack into a Russian SEO article: extract claims, verify links, map keywords, draft the article in Dan's tone, add internal links, and produce a publish checklist.
```

Агенту не нужна твоя оценка, что skill "полезный". Ему нужна инструкция, что делать руками.

### Ошибка 3. Дженерик имя

`skill`, `helper`, `writer`, `assistant`, `utils` -- мусорные имена. Они не помогают ни тебе, ни агенту. Через месяц ты сам не вспомнишь, что внутри.

Нормальные имена:

```text
deploy-coolify
seo-source-pack-writer
dune-ton-analyst
browser-smoke-test
github-pr-reviewer
telegram-crosspost
```

Имя должно быть коротким и операционным. Не "super-smart-agent", а "что этот skill делает".

### Ошибка 4. Пустые секции

Плохой `SKILL.md` часто выглядит как шаблон из Notion:

```markdown
## Context

## Steps

## Examples

## Output
```

Если секция пустая, удали её. Если в секции один абзац общих слов, тоже удали или перепиши. В skill каждый заголовок должен помогать агенту выполнить задачу.

Я обычно оставляю только эти блоки:

- `Goal`
- `When to use`
- `Inputs`
- `Workflow`
- `Stop and ask`
- `Verification`
- `Output format`
- `Supporting files`

И то не всегда все. Skill не обязан выглядеть как enterprise SOP. Он обязан работать.

### Ошибка 5. Многословный trigger

Плохая привычка из старых промптов:

```text
This skill should be used when the user wants you to help them with tasks related to...
```

Сразу минус. Пиши короче:

```text
Use when the user asks to...
```

Каждый лишний токен в `description` не просто стоит денег. Он размывает resolver. У Claude Code есть лимит на то, сколько текста из description/when-to-use будет видно в списке skills. Поэтому первые слова должны не украшать, а маршрутизировать.

### Ошибка 6. Нет output format

Если не сказать, что вернуть в конце, агент будет импровизировать. Иногда это ок. В повторяемом workflow -- нет.

Плохой финал:

```text
Summarize the result.
```

Нормальный финал:

```markdown
## Output format

Return a compact report:

- Decision: publish / needs edits / blocked
- What changed
- Checks performed
- Remaining risks
- Next action
```

Для content workflows это особенно важно. Без формата вывода агент легко превращает нормальный ресерч в красивую кашу.

### Ошибка 7. Противоречия

Классика:

```text
Always use TypeScript.
Support any language.
Never ask the user questions.
Ask the user when requirements are unclear.
```

Модель не "понимает, что ты имел в виду". Она пытается удовлетворить оба требования. В итоге поведение становится случайным.

Хороший skill должен быть скучно непротиворечивым:

```text
Default to TypeScript for this repo. If the project is not TypeScript, follow the existing language.
Ask only when missing information changes the output or creates risk.
```

## Формула нормального SKILL.md

Я бы собирал `SKILL.md` так:

```markdown
---
name: specific-operational-name
description: Use when the user asks to [do specific task], [related task], or [failure mode].
---

## Goal

One sentence. What outcome this skill produces.

## When to use

- Trigger phrase or task type.
- Adjacent task that should also use this skill.
- Task that should NOT use this skill.

## Inputs

- Required files, URLs, IDs, env vars, or user-provided data.
- Where to find project-specific context.

## Workflow

1. Read the minimum required context.
2. Do the work.
3. Verify the result.
4. Report in the required format.

## Stop and ask

- Missing credential.
- Destructive action.
- Ambiguous target.
- Public claim that needs verification.

## Verification

- Command to run.
- File to inspect.
- Browser check to perform.
- Source link to verify.

## Output format

Return:
- result
- evidence
- risks
- next action
```

Это не универсальная истина, но хороший baseline. Самое полезное здесь -- `Stop and ask` и `Verification`. Большинство плохих skills учат агента делать работу, но не учат останавливаться и проверять себя.

## Skill pack: следующий уровень

Вот где начинается нормальная агентная инфраструктура. Skill не обязан быть одним markdown-файлом. По [Agent Skills](https://agentskills.io/) формату skill может быть папкой с `SKILL.md`, scripts, references, assets, templates и другими ресурсами. Claude Code тоже поддерживает supporting files.

То есть хороший skill pack может выглядеть так:

```text
seo-source-pack-writer/
├── SKILL.md
├── references/
│   ├── dan-tone.md
│   ├── seo-checklist.md
│   └── source-verification.md
├── templates/
│   ├── article-outline.md
│   └── publish-checklist.md
├── examples/
│   └── good-output.md
└── scripts/
    └── verify-links.js
```

Главный инсайт: reusable capability -- это не "я однажды написал промпт". Это skill + примеры + проверки + иногда немного кода.

| Слой | Что хранит | Зачем |
| --- | --- | --- |
| `SKILL.md` | Короткий workflow, triggers, stop rules, output | Чтобы агент понял задачу и маршрут |
| `references/` | Подробные правила, docs, tone, domain context | Чтобы не грузить длинный контекст всегда |
| `examples/` | Хороший и плохой output | Чтобы качество было видимым |
| `templates/` | Заготовки отчёта, статьи, PR, чеклиста | Чтобы не изобретать структуру каждый раз |
| `scripts/` | Детеминированные проверки | Чтобы код делал то, где модель не нужна |
| `evals/` | Тестовые запросы и ожидаемое поведение | Чтобы skill не деградировал после правок |

Это ровно та граница, которую я всё чаще вижу в agent workflows: не строить огромную обвязку вокруг модели, если задачу можно оформить как skill + eval. Код остаётся там, где нужна детерминированность: I/O, права, тесты, деплой, парсинг, валидация. Judgment, стиль, процесс и domain knowledge живут в markdown.

## Почему vibe coding без skills не копится

Vibe coding кайфовый, пока задача одноразовая. Сказал агенту "сделай", он сделал, ты принял diff. Но если workflow повторяется, а ты каждый раз заново объясняешь контекст, ты не строишь систему. Ты просто арендуешь внимание модели.

Я теперь смотрю так:

```text
успешная задача -> source pack -> checklist -> skill -> eval
```

Сделал хороший SEO-апдейт? Не просто закрыл задачу. Сохрани:

- какие источники проверять
- какие внутренние ссылки добавлять
- какие фразы нельзя писать
- как выглядит хороший финальный report
- какие команды/проверки запускать

Через неделю это уже не "вспомни, как мы делали". Это `/seo-source-pack-writer`.

В [GStack workflow](/ru/blog/gstack-goal-office-hours-ai-workflow/) у меня примерно такая же логика: goal run, progress artifact, review, потом перенос удачного паттерна в skill. Не потому что хочется больше файлов, а потому что повторяемая работа должна становиться дешевле.

## Skillify в GStack: удачный run должен стать skill

В GStack это называется `skillify`: после удачного agent run ты не просто радуешься демке, а превращаешь рабочий сценарий в повторяемый skill. Важно: в текущем GStack это не универсальная кнопка "сделай мне любой skill". Самый понятный пример -- связка `/scrape` и `/skillify` для browser-skills.

Как это устроено по [GStack docs](https://github.com/garrytan/gstack/blob/main/BROWSER.md#skillify) и [TODO/design notes](https://github.com/garrytan/gstack/blob/main/TODOS.md#browser-skills-phase-2--scrape-and-skillify-skill-templates):

1. `/scrape` сначала прототипирует flow через браузерные `$B` команды.
2. Если прототип дал нормальный JSON, `/skillify` идёт назад по последним agent turns и ищет именно этот успешный `/scrape`.
3. Он берёт только финальные `$B` calls, которые привели к принятому результату. Не тащит failed selectors, переписку, reasoning и старые попытки.
4. Предлагает имя, triggers и tier: project или global.
5. Генерирует `script.ts`, `script.test.ts`, HTML fixture и локальную копию `_lib/browse-client.ts`.
6. Кладёт всё во временную папку `~/.gstack/.tmp/skillify-<spawnId>/`.
7. Запускает тест против fixture.
8. Только если тест прошёл и человек подтвердил, делает atomic rename в `.gstack/browser-skills/<name>/` или `~/.gstack/browser-skills/<name>/`.

То есть `skillify` не сохраняет красивую простыню из чата. Он сжимает удачный интерактивный run в маленький deterministic package.

Нормальный цикл выглядит так:

```text
office-hours -> goal run -> progress artifact -> review -> skillify -> eval
```

В browser-skill после `skillify` лежит примерно такая структура:

```text
browser-skills/<name>/
├── SKILL.md
├── script.ts
├── script.test.ts
├── fixtures/<host>-<date>.html
└── _lib/browse-client.ts
```

Самая важная часть тут даже не `SKILL.md`. Важна связка:

- `SKILL.md` объясняет, когда skill вызывать и какой JSON он возвращает;
- `script.ts` делает детерминированную работу, которую не надо каждый раз заново "вспоминать";
- `script.test.ts` проверяет parser на сохранённом HTML fixture;
- `_lib/browse-client.ts` делает skill self-contained, чтобы он не зависел от дрейфа SDK;
- atomic stage/commit защищает от полусломанных skills в списке.

Это хороший пример современного skill pack. Современный skill -- это не "prompt получше". Это маленький пакет с routing contract, executable path, test fixture, trust boundary и output protocol. В `browser-skill-write.ts` у GStack для этого есть отдельные примитивы: `stageSkill`, `commitSkill`, `discardStaged`. Смысл простой: плохой skill в списке хуже, чем отсутствие skill. Он будет маршрутизировать агента в неправильный инструмент и портить доверие.

Если переносить эту идею на Claude Code skills, то хороший `SKILL.md` должен быть следом от реального удачного run. Не "я придумал идеальную инструкцию", а:

- мы уже сделали задачу руками;
- поняли, какие шаги реально нужны;
- выкинули failed attempts;
- сохранили минимальный workflow;
- добавили stop conditions;
- добавили проверку;
- описали output format.

Если пропустить `skillify`, знания остаются в переписке. Если сделать его нормально, через неделю агент уже не спрашивает заново, что такое хороший SEO-апдейт, как оформлять обложку, какие проверки запускать и где остановиться.

## Как писать description, чтобы Claude сам вызывал skill

`description` должен отвечать на три вопроса:

1. Какая задача?
2. Какие близкие варианты этой задачи?
3. Когда skill НЕ нужен?

Плохой вариант:

```yaml
description: Helps write better content.
```

Нормальный вариант:

```yaml
description: Use when turning a verified source pack into a Russian SEO article for okhlopkov.com. Covers keyword mapping, Dan's tone of voice, internal links, public-claim verification, and publish checklist. Do not use for short Telegram posts.
```

Ещё лучше -- добавить `when_to_use`, если в текущей версии Claude Code это поле доступно в твоём setup:

```yaml
when_to_use: Trigger on requests like "обнови статью", "ingest source into article", "SEO article from source pack", or "rewrite in Dan's tone". Do not trigger for code-only tasks.
```

Тут уже видно, когда skill нужен. И видно, когда не нужен. Это спасает от skill bloat, где агент грузит пять похожих процедур и начинает спорить сам с собой.

## Когда нужен код внутри skill

Код нужен не для того, чтобы "сделать skill серьёзнее". Код нужен, когда модель плохо подходит для операции.

Хорошие причины положить script в skill:

- проверить ссылки в статье
- посчитать слова или заголовки
- валидировать JSON/YAML
- прогнать unit tests
- вытащить schema из API
- нормализовать CSV
- открыть browser smoke
- проверить, что sitemap не содержит старый URL

Плохие причины:

- "пусть будет Python, так солиднее"
- "модель может ошибиться, завернём всё в код"
- "надо сделать фреймворк для всех будущих задач"

Это ловушка старого инженерного мышления: больше кода не всегда значит больше capability. Иногда лучший шаг -- потратить токены на reasoning, а код оставить для проверки фактов и границ.

## Evals для skills: скучно, но окупается

Если skill важный, его надо тестировать не только "на глаз". Минимальный eval можно сделать даже без отдельного фреймворка:

```text
evals/
├── should-trigger.md
├── should-not-trigger.md
├── output-format.md
└── regression-notes.md
```

Примеры:

```markdown
# should-trigger

User: "обнови статью про Claude Code skills из source pack и сохрани SEO"
Expected: loads seo-source-pack-writer

# should-not-trigger

User: "проверь TypeScript ошибку в ArticleLayout"
Expected: does not load seo-source-pack-writer

# output-format

User: "собери финальный отчёт после публикации"
Expected sections:
- changed URL
- redirects
- checks
- remaining risks
```

Это не обязательно автоматизировать в первый день. Но если skill используется часто, evals быстро начинают экономить время. Особенно после правок, когда ты вроде "улучшил" description, а агент внезапно перестал вызывать skill в нужных местах.

## Практический пример: SEO article skill

Вот как я бы оформил skill для обновления статей на okhlopkov.com:

```markdown
---
name: okhlopkov-seo-article
description: Use when updating or creating an okhlopkov.com SEO article from a source pack, keyword research files, Telegram post, podcast notes, or external article. Covers Dan's tone, public claim verification, internal links, schema-ready FAQ, redirects, and publish checks.
---

## Goal

Create or update an SEO article that sounds like Dan, has useful substance, and does not break existing traffic.

## Required context

- Read `projects/digital-twin/dania-zip/danya-prompt.md`.
- Read the source pack or raw source named by the user.
- Check local keyword research files if the user mentions SEO keywords.
- Check existing URLs and internal links before changing slugs.

## Workflow

1. Identify the current page, canonical URL, sitemap status, and traffic risk.
2. Extract claims from source material without copying structure or metaphors.
3. Map primary and secondary keywords.
4. Draft in Dan's RU long-form voice.
5. Add 2-4 verified internal links.
6. Add FAQ questions if they answer real search intent.
7. Preserve SEO with redirects when moving a URL.
8. Build and verify canonical, sitemap, OG image, and old URL behavior.

## Stop and ask

- If moving a URL with meaningful traffic and no redirect path exists.
- If a public claim needs a source and no source can be found.
- If the article would require private vault facts or credentials.

## Output format

Return:
- article URL
- old URL and redirect behavior
- keywords used
- checks passed
- remaining risks
```

Такой skill не "пишет текст". Он держит весь publish loop: от ресерча до проверки редиректа. Это намного полезнее, чем очередной промпт "write an SEO article in my style".

## Как понять, что skill хороший

У меня чеклист такой:

1. По названию понятно, что он делает.
2. `description` содержит реальные triggers.
3. В body нет мотивационных абзацев.
4. Есть clear stop conditions.
5. Есть output format.
6. Есть verification.
7. Supporting files вынесены отдельно, если body разрастается.
8. У skill есть хотя бы 2-3 тестовых запроса: должен сработать / не должен сработать.
9. После успешного использования ты обновил skill, а не оставил знание в чате.
10. Через месяц другой агент сможет им пользоваться без твоего устного объяснения.

Если skill не проходит первые пять пунктов, он ещё не skill. Это черновик.

## Мини-чеклист перед сохранением

- Название конкретное: `deploy-coolify`, не `helper`.
- `description` начинается с `Use when`.
- В trigger есть 2-4 реальные формулировки пользователя.
- Есть секция, когда НЕ использовать skill.
- Нет пустых секций.
- Нет противоречий.
- `Workflow` написан действиями, не общими пожеланиями.
- Есть `Stop and ask`.
- Есть `Verification`.
- Есть `Output format`.
- Длинные reference материалы вынесены в отдельные файлы.
- Для важного skill есть eval notes.

## Что делать сегодня

Не надо сразу строить marketplace skills, plugin, eval harness и команду сабагентов. Возьми один повторяемый workflow, который уже бесит.

Например:

- ревью PR
- деплой
- SEO article update
- Dune SQL research
- браузерная проверка страницы
- Telegram crosspost
- подготовка отчёта

Сделай минимальный `SKILL.md`. Запусти его 3 раза. После каждого запуска обнови trigger, stop conditions и output format. Через несколько итераций у тебя будет не prompt collection, а маленькая библиотека рабочих процедур.

Вот это и есть смысл Claude Code skills: меньше заново объяснять, больше накапливать capability.

## Читать ещё

- [Мой сетап Claude Code 2026: MCP, hooks, skills и агенты](/claude-code-nastrojka-mcp-hooks-skills-2026/)
- [Лучшие skills и MCP для Claude Code](/luchshie-skills-mcp-claude-code-agent-browser/)
- [Improve codebase architecture prompt](/ru/blog/improve-codebase-architecture-prompt/)
- [AI-трансформация компании: общий контекст, skills и GBrain](/ru/blog/ai-transformaciya-kompanii-obshchiy-kontekst-skills-gbrain/)
- [Hermes Agent vs OpenClaw](/ru/articles/hermes-agent-vs-openclaw/)

## FAQ

### Что такое Claude Code skills?

Claude Code skills -- это папки с `SKILL.md` и опциональными supporting files, которые расширяют возможности Claude Code. Агент видит описание skill, загружает полный workflow только когда задача релевантна, и может выполнять инструкции, читать reference files или запускать scripts из skill pack.

### Чем skill отличается от CLAUDE.md?

`CLAUDE.md` хранит общий контекст проекта: структуру, правила, запреты, стиль работы. Skill хранит повторяемую процедуру: деплой, ревью, ресерч, публикацию статьи, анализ данных. Если инструкция нужна почти всегда, ей место в `CLAUDE.md`. Если нужна только для конкретного класса задач, лучше сделать skill.

### Как назвать skill для Claude Code?

Название должно описывать действие: `deploy-coolify`, `github-pr-reviewer`, `seo-source-pack-writer`, `dune-ton-analyst`. Не называй skills `helper`, `utils`, `writer` или `assistant`: такие имена не помогают ни человеку, ни агенту выбрать правильную процедуру.

### Нужны ли tests или evals для skill?

Для простого личного skill можно начать без evals. Для важного workflow лучше завести хотя бы ручные eval notes: запросы, на которых skill должен сработать, запросы, где он не должен сработать, и ожидаемый output format. Это быстро ловит деградацию после правок `description`.

### Можно ли копировать чужие Claude Code skills?

Можно, но лучше не ставить пачку чужих skills вслепую. Забирай структуру, triggers, примеры и хорошие stop conditions, потом адаптируй под свой проект. Чужой skill без твоего контекста часто превращается в шум в context window.
