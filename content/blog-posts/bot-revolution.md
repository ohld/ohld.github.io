---
slug: bot-revolution
title: The Bot Revolution: один Главный и сто AI-агентов
description: Следующая ступень AI-инструментов — один Chief of Staff, постоянная память и команда специализированных ботов.
publishedAt: 2026-08-26
updatedAt: 2026-08-26
readingTime: 7 мин
tags: AI Agents, Grok Bot, Hermes Bot, Telegram
coverImage: /assets/drafts/bot-revolution/bot-weather-map.webp
coverAlt: The Bot Revolution — карта с командой AI-ботов
sourceTelegramId:
primaryKeyword: AI агенты
secondaryKeywords: Grok Bot; Hermes Bot; Chief of Staff; agent loops; AI команда
views: 0
forwards: 0
comments: 0
reactions: 0
---

Кажется, следующая ступень AI-инструментов уже началась. AI перестаёт быть одной дорогой сессией и превращается в команду.

## Короткий таймлайн AI-революций

- **2023 — ChatGPT.** AI лучше гуглит.
- **2024 — Cursor.** AI помогает прогать.
- **2025 — Claude Code.** AI лучше прогает.
- **2026 — OpenClaw.** AI интегрируется с сервисами.
- **2026.5 — The Bot Revolution.** AI становится командой.

## Всё не засунуть в одну сессию

Опытные AI-разработчики уже поняли: всю инфу всех проектов не засунуть в один контекст. А так хочется иметь `single point of contact`: писать Chief of Staff, чтобы он прочитал нужное и порешал сам.

[Grok Bot](https://t.me/ohld_chat/45534), [Hermes Bot](https://t.me/ohld_chat/45546) и [Berd](https://t.me/danokhlopkov/1731) почти синхронно релизнули новый формат общения с агентами: личные и групповые чаты, сотрудники, лупы.

Один из таких лупов выглядит так:

`bug → Sentry → fix → PR → review → CI green → deploy → bug`

[Про такой agent loop я уже рассказывал на стриме о Paperclip](https://t.me/danokhlopkov/1659).

## Не один супер-агент, а нормальное разделение труда

Один агент ищет, другой пишет код, третий проверяет. Главный помнит, что мы вообще пытаемся сделать, и подключает нужного. Так контекст не превращается в бесконечную дорогую вкладку с амнезией.

Это пока сырой интерфейс, и Grok Bot вполне может не взлететь. Но сама идея уже сдвинулась от «открой ещё один чат» к «собери мне команду».

Большую разработку с нуля всё ещё удобнее вести через Claude Code, Codex или Grok CLI. Grok Bot и Hermes интереснее на уже живом проекте: поддерживать прод, обсуждать фичи, делать небольшие фиксы.

В [OHLD Chat](https://t.me/ohld_chat/45541) писали, что боты всё ещё могут замыкаться в лупы и не давать внятного результата. А попытка собрать такого Гермеса для SMM оказывается сложной и технически, и продуктово: нужно не только склеить систему, но и объяснить людям, что с ботом можно работать как с человеком.

## Один Главный — сто агентов

Организовать это можно как маленькую компанию. Один Chief видит все проекты и держит общий борд. Остальные боты работают по своим функциям.

В личном чате контекст держит один бот. В [group chat](https://docs.x.ai/grok-bot/chat-and-collaboration) вы собираете 2–6 ботов вокруг общей задачи: они видят один разговор, пишут туда сами и передают работу друг другу.

У Chief одна часовая рутина: открыть общий борд, проверить задачи и продолжить всё, что остановилось. Не нужно отдельно будить каждого бота и тратить токены во всех чатах.

Я уже примерно так и работаю. Кросс-проектные и личные запросы начинаю в папке на iCloud — это единый вход. Codex сам идёт в нужные папки, раздаёт работу subagents и собирает ответ.

Задачи часто не заканчиваются одной сессией. Но сохранённое остаётся в проекте, а [GBrain](https://t.me/danokhlopkov/1685) поднимает прошлые решения и результаты. Поэтому новый запрос начинается там, где мы остановились.

## В Telegram уже есть почти все примитивы

[Топики](https://core.telegram.org/bots/features#topics-in-private-chats). [Bot-to-bot](https://core.telegram.org/bots/features#bot-to-bot-communication). [Managed Bots](https://core.telegram.org/bots/features#managed-bots).

Но сотню сотрудников в одном аккаунте пока не собрать: [лимит BotFather — 20 ботов, с Premium — 40](https://core.telegram.org/api/config#bots-create-limit-default).

Поэтому особенно интересно, что покажет нам [Fabrika](https://t.me/karfly_livestream/293).

## А сколько это стоит?

Grok Bot можно попробовать через [Cursor Pro+ за $60](https://cursor.com/pricing) или [SuperGrok Plus за $100](https://x.ai/pricing). [SuperGrok Heavy стоит $300](https://x.ai/bot): в нём максимальные лимиты для Chat, Imagine, Voice, Build и ботов.

$300 кусается сильнее максимальных Codex и Claude Code — обе подписки по $200. Лимитов по $100 мне уже не хватает, поэтому я сразу go $300. Будем пытаться реимбурсить))

## Спроси агента, который тебя знает

> Based on what you know about me, how would you set up GrokBot? Which bots should we set up?

[Промпт из видео](https://www.youtube.com/watch?v=vrgO4D_mUlA&t=667s). Так можно найти и свои agent loops: рутины, которые уже пора отдать ботам.

Следующая революция будет не в более умных моделях. Она будет в том, как мы с ними работаем: один Главный, сотрудники, память и рутины. Короче, сделать всё как у людей.

Читать ещё: [как AI-агенты ведут проект в фоне](/ru/blog/business-on-ai-agent-claude-code-paperclip-gstack/) и [чем Hermes Agent отличается от OpenClaw](/ru/articles/hermes-agent-vs-openclaw/).
