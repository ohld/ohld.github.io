---
slug: hermes-agent-vs-openclaw
lang: ru
title: Hermes Agent vs OpenClaw: что выбрать для AI-агента
description: Практическое сравнение Hermes Agent и OpenClaw: Telegram, установка, память, skills, MCP, cron, безопасность, токены и сценарии для self-hosted AI-агента.
publishedAt: 2026-05-28
updatedAt: 2026-06-06
readingTime: 15 мин
tags: AI Agents, Hermes Agent, OpenClaw, Telegram Automation, MCP
coverImage: /assets/articles/hermes-agent-vs-openclaw/hermes-openclaw-cover.webp
coverAlt: Мем-обложка Hermes vs OpenClaw про day-30 тест AI-агента
sourceTelegramId: 0
primaryKeyword: hermes agent vs openclaw
secondaryKeywords: hermes agent; openclaw; ai агент telegram; self hosted ai agent; telegram ai agent; ai агент с памятью; openclaw альтернатива; claude code agent; mcp агент; ai agent framework comparison; hermes agent skills; hermes proficiencies; openclaw migration; tool sop; progressive disclosure
views: 0
forwards: 0
comments: 0
reactions: 0
---

Коротко: **OpenClaw я бы брал как self-hosted gateway для разных каналов, а Hermes Agent как личного ops-агента, который живет в Telegram, помнит рабочий контекст и со временем обрастает skills.**

У них пересекаются фичи: Telegram, память, tools, cron, выполнение кода, работа с файлами, web search, skills. Но выбирать только по таблице функций странно. Настоящий тест начинается не на установке, а на day-30: что происходит с токенами, памятью, безопасностью, cron-задачами, allowlist, браузером и задачами, которые прилетают с телефона голосом.

## Видео и живой контекст

Эта статья — не только по документации. Контекст лучше смотреть вместе с двумя русскими видео: [AI-сетап с Claude Code/Cursor и базой чатов](https://www.youtube.com/watch?v=yJuzI2u-AnM) и [AI-агенты ведут проект, пока я в отпуске](https://www.youtube.com/watch?v=E3P0a03mN8A). Там видно, зачем вообще нужен слой “агент живет дольше одного чата”: Telegram, память, фоновые задачи, ревью и переносимость контекста.

## Короткий вывод

Если хочется быстро поднять агентный gateway для Telegram, Slack, WhatsApp, Discord и нескольких рабочих поверхностей, я бы начинал с [OpenClaw](/topics/openclaw/). Если задача ближе к личному ассистенту, который живет на сервере, помнит рабочий контекст, улучшает skills и пишет в Telegram по cron, я бы тестировал Hermes Agent.

Для меня [AI-агент](/topics/ai-agents/) должен переживать обычную неделю: рестарты, лимиты моделей, кривые сайты, устаревшие skills, случайные файлы, Telegram-апрувы и задачи, которые приходят не как аккуратный Jira-ticket, а как "глянь вот это, собери выводы и напомни завтра".

## Почему вообще сравнивать Hermes Agent и OpenClaw

Списков фич хватает. Практических разборов на русском мало: установка, Telegram, память, security, токены, cron и реальная жизнь через месяц обычно важнее красивой таблицы на GitHub.

Я смотрю на эти инструменты как на инфраструктуру для always-on агента. Нужно понять, где он живет, кто может ему писать, какие файлы он видит, как он хранит память, как зовет [MCP](/topics/mcp/), когда просит approval и как доставляет результат обратно в Telegram. В связке с [GBrain](/topics/gbrain/) и [AI-агентом на сервере 24/7](/ai-agent-na-servere-24-7/) это уже похоже на личную операционную систему.

## Что такое OpenClaw

[OpenClaw](https://docs.openclaw.ai/) я бы описывал как self-hosted gateway для агентной жизни в мессенджерах. Его сильная сторона не в том, что он "тоже умеет чатиться с LLM", а в control plane: каналы, сессии, tools, доступы, память, skills, cron и multi-agent routing.

Это полезно, когда Telegram не единственная поверхность. Например, один агент работает в Telegram, другой в Slack, третий в Discord, а общий gateway держит правила доступа, sandbox и delivery. Чем больше каналов и ролей, тем важнее явные границы.

## Что такое Hermes Agent

[Hermes Agent от Nous Research](https://github.com/NousResearch/hermes-agent?ref=danokhlopkov) идейно ближе к личному агенту, который со временем должен становиться полезнее. Важный слой тут не "еще один Telegram bot", а [learning loop](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory?ref=danokhlopkov): curated memory, поиск по прошлым сессиям, [skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills?ref=danokhlopkov), MCP, cron, subagents, разные backends для выполнения кода и gateway в мессенджеры.

Мне в Hermes нравится практический angle: агент живет на VPS или в контейнере, общается через Telegram, может доставлять результат обратно в чат и держит отдельные профили под разные роли. Это уже не демо поверх модели, а персональная инфраструктура.

## Главная разница: gateway против learning loop

OpenClaw я бы брал, когда нужен надежный вход из разных мессенджеров и понятное разделение агентов. Hermes Agent выглядит сильнее, когда главный сценарий один: постоянный личный агент, который учится на повторяемых задачах, сам создает или улучшает skills и регулярно делает фоновые штуки через cron.

| Ось | OpenClaw | Hermes Agent |
| --- | --- | --- |
| Базовая роль | Gateway и control plane для агентных каналов. | Личный агент с learning loop и долгой памятью. |
| Telegram | Сильный канал, группы, allowlist, topics, plugins. | Удобный gateway для личного агента и delivery cron-задач. |
| Память | Markdown workspace, daily notes, memory plugins, search. | MEMORY.md/USER.md, SQLite FTS5 session search, external memory providers. |
| Skills | AgentSkills folders, ClawHub, workspace/global scopes. | Agent-managed skills, bundles, curator и procedural memory. |
| Код и sandbox | Gateway, exec approvals, sandbox, nodes. | Docker/SSH/Modal/Daytona/Singularity-style backends. |
| Профили | Несколько агентов через workspaces/channels/routing. | Изолированные profiles с отдельными config, env, SOUL, memory, skills и gateway. |
| Кому ближе | Power users, которым нужен multi-channel router. | Тем, кто хочет персонального ops-агента на сервере. |

## Установка и первый setup

По установке OpenClaw сейчас выглядит как Node-проект: актуальный Node, установка через npm, onboarding и запуск dashboard или канала. Hermes Agent ставится как Python-проект: [quickstart через install script](https://hermes-agent.nousresearch.com/docs/getting-started/installation?ref=danokhlopkov), дальше provider, модель, профиль и gateway.

Но реальная сложность начинается после первой команды. Нужно решить, где агент живет: локально, на VPS, в Docker, через SSH backend, в Coolify или в отдельном sandbox. Для постоянного Telegram-агента я бы сразу думал про сервер, отдельный volume, backup, allowlist и понятный scope файлов. Агент с доступом к терминалу и домашней папке без границ быстро превращается в риск.

![Мем про always-on агента и cron дома](/assets/articles/hermes-agent-vs-openclaw/setup-cron-home.webp)

## Telegram

Telegram в этой теме выигрывает у отдельного desktop app почти всегда. Он уже стоит на телефоне и ноуте, умеет голосовые, файлы, группы, топики, push-уведомления и нормальный async-режим. Для бытовых задач, ресерча, напоминаний и фоновых jobs это лучший интерфейс, который не надо объяснять.

OpenClaw сильнее, когда Telegram - один из многих каналов. Hermes приятнее, когда Telegram становится home channel для личного агента: ты пишешь с телефона, агент работает на сервере, а результат возвращается туда же. Подробности дальше логично собирать в [Telegram-автоматизации](/topics/telegram-automation/): Telegram как remote control для агентной инфраструктуры.

![Мем про Telegram как пульт от AI-агента](/assets/articles/hermes-agent-vs-openclaw/telegram-remote-control.webp)

## Память, skills и MCP

Тут важно не верить словам "память" слишком буквально. OpenClaw хранит память в Markdown-файлах workspace и добавляет memory plugins/search. Это кайф для людей, которые любят Obsidian-подход: все лежит на диске, можно открыть глазами, можно версионировать, можно чинить руками.

Hermes делает более жесткую [curated memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/?ref=danokhlopkov): маленькие `MEMORY.md` и `USER.md` для фактов, которые должны быть всегда в контексте, плюс SQLite/FTS5 session search для прошлых разговоров и external memory providers для более длинной памяти. Плюс в том, что память не обязана превращаться в бесконечную простыню prompt context. Минус очевидный: если ждать от памяти магический infinite context, будет больно в любом инструменте.

Skills лучше воспринимать как переносимый operational layer: инструкция к повторяемой работе, где прописано, как собрать ресерч, как проверить браузер, как обновить статью, как не забыть источники. В Hermes это еще и [agent-managed procedural memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills/?ref=danokhlopkov): агент может создавать и патчить skills после сложных задач, ошибок или явных правок пользователя. Поэтому важен [curator](https://hermes-agent.nousresearch.com/docs/user-guide/features/curator?ref=danokhlopkov): без уборки skills быстро превращаются в свалку узких дубликатов.

Из найденного репозитория [hermes-proficiencies](https://github.com/sene1337/hermes-proficiencies) я бы забрал не "еще пачку skills", а саму рамку: разделять human SOP, tool SOP, review protocol, publishing gate и workspace hygiene. Это полезнее, чем просто поставить 100 skills и надеяться, что агент стал умнее. Для моего сайта это уже работает через [Claude Code setup](/claude-code-nastrojka-mcp-hooks-skills-2026/), GBrain и сабагентов: source pack отдельно, текст отдельно, ревью отдельно.

## Hermes skills: не промпты, а runtime-контракты

Плохой skill - это длинный промпт с пожеланиями. Хороший skill отвечает на более скучные, но важные вопросы: когда его грузить, какие tools можно трогать, где остановиться и спросить, что считается готовым результатом, как проверить output и что нельзя публиковать наружу.

Поэтому в Hermes/OpenClaw сравнении я бы отдельно проверял не "сколько skills в коробке", а качество skill governance. Есть ли [progressive disclosure](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills/?ref=danokhlopkov), не грузятся ли десятки нерелевантных инструкций, можно ли быстро найти дубль, есть ли review loop после реального использования. У Hermes тут сильная идея: skills становятся процедурной памятью. Но это же создает новый риск: если не чистить библиотеку, агент начинает путаться в собственных инструкциях.

OpenClaw-подход тоже не надо выкидывать. Из него полезно переносить file routing, явные boundaries, publish checks и workspace discipline. Просто переносить это надо в Hermes-native форму: не "скопировал старую SOP", а сделал Tool SOP с invocation rules, risk classes, stop/ask/escalate и verification.

## Профили и несколько агентов

Еще одна важная разница: Hermes profiles - это не просто разные personalities. В официальной модели у профиля могут быть свои `config.yaml`, `.env`, `SOUL.md`, memory, skills, state database, gateway process и даже отдельный Telegram/Discord/Slack token. Это ближе к нескольким изолированным агентам, чем к одному чату с разными масками.

На практике я бы не начинал с "команды из 10 агентов". Сначала один профиль для личного ops-агента, потом второй для research/content, и только после этого отдельный coder/designer. Иначе multi-agent быстро превращается в дорогой способ размножить хаос.

## Что ломается первым

Большинство сравнений упирается в таблицу фич. Она полезна, но скучная. В реальной жизни первыми ломаются границы: контекст, доступы, каналы, токены, память и уверенность агента в старых выводах.

| Проблема | Как выглядит | Что проверять |
| --- | --- | --- |
| Token burn | Агент грузит слишком много skills, истории и tool output. | Pruning, prompt cache, лимиты tool output, короткие skills. |
| Provider risk | Модель упала, rate limit, бан, смена pricing, разные ответы. | Fallback models, OpenRouter/Nous/OpenAI routing, дешевые subagents. |
| Memory attic | Память растет, агент тащит старые решения и мусор. | Короткая curated memory, отдельные source packs, регулярная чистка. |
| Skill bloat | Агент создал десятки похожих skills, и каждый следующий запуск шумнее. | Bundles, curator, pinning важных skills, review loops, удаление дублей. |
| Browser handoff | Нужны cookies и живой браузер, а агент видит пустой sandbox. | MCP bridge, live Chrome, отдельные browser skills, ручной fallback. |
| Cron silence | Job сработал, но в Telegram ничего не пришло. | Delivery target, home channel, logs, минимальный test cron. |
| Security drift | Вчера был безопасный бот, сегодня у него exec и секреты. | Allowlist, approvals, sandbox, отдельный user, backup, audit logs. |

## Безопасность

Агент в Telegram с exec-доступом - это не игрушка. OpenClaw в документации отдельно описывает DM policies, [allowlist](https://docs.openclaw.ai/gateway/config-channels), [exec approvals](https://docs.openclaw.ai/tools/exec-approvals) и sandbox controls. Hermes тоже надо закрывать слоями: allowlist/pairing, approvals для опасных команд, container isolation, MCP credential filtering и ограничения на рабочие директории.

Мой минимальный baseline: один владелец, явный Telegram allowlist, отдельный серверный пользователь, Docker/SSH sandbox для команд, secrets только в env/secret store, backup workspace, логирование, запрет на публичный open-DM режим. Если агент может читать vault, браузер и терминал, то "потом настрою безопасность" уже поздно.

![Мем про exec без allowlist у AI-агента](/assets/articles/hermes-agent-vs-openclaw/security-allowlist.webp)

## Кому выбрать OpenClaw

- Нужен multi-channel gateway: Telegram, Slack, WhatsApp, Discord, WebChat, mobile nodes.
- Хочется держать несколько агентов под разные каналы, роли или workspaces.
- Важны локальные Markdown-файлы памяти, ClawHub, manual skill control и dashboard.
- Нужна более быстрая gateway-обвязка без обязательного learning-loop overhead.
- Команда готова красноглазить config/security и нормально документировать доступы.

## Кому выбрать Hermes Agent

- Нужен личный always-on агент в Telegram, который живет на VPS и работает фоном.
- Важны profiles, personality/user context, curated memory, session search и self-improving skills.
- Нужны несколько изолированных профилей: отдельные `config.yaml`, `.env`, `SOUL.md`, memory, skills и Telegram/Discord/Slack gateway.
- Нужны cron-задачи с доставкой результата обратно в чат.
- Хочется подключать MCP, GBrain, browser/search и external memory providers.
- Ок с тем, что агент может думать медленнее, зато держит более тяжелый рабочий цикл.

## Мой тест-план на 48 часов

1. Поднять агента на отдельном VPS или в контейнере, подключить Telegram через allowlist.
2. Сделать три бытовые задачи: voice summary, web research, file/document analysis.
3. Сделать одну рабочую задачу: собрать source pack для статьи и сохранить вывод в GBrain.
4. Настроить один cron: утренний дайджест или мониторинг источников с доставкой в Telegram.
5. Проверить memory hygiene: что попало в long-term memory, что осталось в raw notes, что надо удалить.
6. Прогнать security checklist: кто может писать боту, где секреты, есть ли backup и sandbox.

Если после этого агентом хочется пользоваться с телефона без ощущения, что ты держишь опасный demo-проект на честном слове, инструмент можно оставлять. Если always-on слой пока рано, начните с более узкого [Claude Code/Codex workflow](/ru/blog/claude-code-vs-codex-perehod/) и добавляйте серверного агента только после нормального security baseline.

## Если выбираете стек дальше

Начните с одного сценария и не тащите всю агентную инфраструктуру сразу. Для личного Telegram-агента проверьте [Hermes setup](https://hermes-agent.nousresearch.com/docs/getting-started/installation?ref=danokhlopkov), память, cron и approvals. Для gateway-подхода изучите OpenClaw, каналы, allowlist, skills и exec boundaries. Для рабочих задач без сервера часто хватает Claude Code или Codex.

- [OpenClaw hub](/topics/openclaw/): установка, настройка, Telegram, GitHub, skills, ошибки.
- [AI-агенты](/topics/ai-agents/): карта инструментов и сценарии, где агент окупается.
- [MCP](/topics/mcp/): browser, Telegram, GBrain, docs, GitHub и живые data sources.
- [Markdown vs HTML](/articles/markdown-vs-html/): формат артефактов, которые агент пишет, а человек читает.

## FAQ

### Что лучше: Hermes Agent или OpenClaw?

Для multi-channel gateway и нескольких агентов я бы начинал с OpenClaw. Для личного Telegram/VPS ассистента с памятью, cron и self-improving skills я бы начинал с Hermes Agent. Лучший выбор зависит от day-30 сценария, а не от списка фич.

### Можно ли использовать Hermes Agent через Telegram?

Да. Hermes поддерживает messaging gateway, и Telegram входит в основной сценарий. Но перед продом нужно настроить allowlist/pairing, approvals, sandbox и delivery target для cron.

### Можно ли использовать OpenClaw через Telegram?

Да. Telegram у OpenClaw один из ключевых каналов. Важные настройки: BotFather token, `dmPolicy`, `allowFrom`, группы, topics и доступные tools.

### Что проще поставить на Windows?

Hermes чаще разумнее ставить через WSL2. OpenClaw ближе к Node/npm setup. Но простая установка не гарантирует безопасную работу 24/7, поэтому Windows я бы использовал для теста. Постоянного агента лучше выносить на сервер.

### Можно ли просто перенести skills из OpenClaw в Hermes?

Можно использовать старые OpenClaw SOP и skills как source pack, но не стоит копировать их один в один. Лучше пройти [migration guide](https://hermes-agent.nousresearch.com/docs/guides/migrate-from-openclaw?ref=danokhlopkov), вытащить рабочие правила и переписать их как Hermes skills с явными trigger, boundaries, verification и publish-safety.

### Стоит ли ставить hermes-proficiencies?

Я бы сначала читал [hermes-proficiencies](https://github.com/sene1337/hermes-proficiencies) как набор хороших примеров, а не как обязательный install. Там полезная рамка: human SOP, Tool SOP, publishing gate, workspace hygiene. Но конкретный способ установки и совместимость со skill taps лучше проверить на своей версии Hermes перед тем, как советовать это новичкам.

## Источники

- [Hermes Agent GitHub](https://github.com/NousResearch/hermes-agent?ref=danokhlopkov)
- [Hermes Agent documentation](https://hermes-agent.nousresearch.com/docs/?ref=danokhlopkov)
- [Hermes Agent memory docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory?ref=danokhlopkov)
- [Hermes Agent skills docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills?ref=danokhlopkov)
- [Hermes Agent profiles docs](https://hermes-agent.nousresearch.com/docs/user-guide/profiles?ref=danokhlopkov)
- [Hermes Agent messaging gateway docs](https://hermes-agent.nousresearch.com/docs/user-guide/messaging?ref=danokhlopkov)
- [Hermes Agent curator docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/curator?ref=danokhlopkov)
- [Hermes migration from OpenClaw](https://hermes-agent.nousresearch.com/docs/guides/migrate-from-openclaw?ref=danokhlopkov)
- [Hermes Agent security docs](https://hermes-agent.nousresearch.com/docs/user-guide/security/?ref=danokhlopkov)
- [hermes-proficiencies](https://github.com/sene1337/hermes-proficiencies)
- [OpenClaw documentation](https://docs.openclaw.ai/)
- [OpenClaw memory docs](https://docs.openclaw.ai/concepts/memory)
- [OpenClaw skills docs](https://docs.openclaw.ai/tools/skills)
- [OpenClaw channel access docs](https://docs.openclaw.ai/gateway/config-channels)
- [OpenClaw exec approvals docs](https://docs.openclaw.ai/tools/exec-approvals)

## Читать еще

- [OpenClaw hub](/topics/openclaw/)
- [AI-агенты](/topics/ai-agents/)
- [Telegram-автоматизация](/topics/telegram-automation/)
- [GBrain](/topics/gbrain/)
- [AI-агент на сервере 24/7](/ai-agent-na-servere-24-7/)
- [Мой Claude Code setup](/claude-code-nastrojka-mcp-hooks-skills-2026/)
- [Claude Code vs Codex: почему я на две недели перешёл на Codex](/ru/blog/claude-code-vs-codex-perehod/)
- [Видео: AI-агенты ведут проект, пока я в отпуске](https://www.youtube.com/watch?v=E3P0a03mN8A)
