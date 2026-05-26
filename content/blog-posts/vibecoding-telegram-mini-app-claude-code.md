---
slug: vibecoding-telegram-mini-app-claude-code
title: Telegram Mini App с Claude Code: llms.txt, крестики-нолики и деплой без чтения доков
description: Как я собрал source pack для Telegram Mini Apps, сделал llms.txt, сгенерил TMA с Claude Code и задеплоил игру. Чеклист, что ломается чаще всего.
publishedAt: 2026-05-26
updatedAt: 2026-05-26
readingTime: 9 мин
tags: Telegram Mini Apps, Claude Code, Vibe Coding
sourceTelegramId: 1606
primaryKeyword: telegram mini app claude code
secondaryKeywords: telegram mini app; llms.txt; telegram mini app tutorial; tma llms; ai coding agent workflow
views: 6715
forwards: 183
comments: 14
reactions: 36
---

Короткая версия: чтобы AI-агент нормально собрал Telegram Mini App, ему нужен не “сделай миниаппку”, а компактный source pack: официальные доки, SDK, ограничения Telegram WebView, init data, деплой и примеры. Для этого я собрал [tma-llms-txt](https://github.com/ohld/tma-llms-txt), а потом на стриме сделал простые крестики-нолики.

Запись: [youtu.be/s92JCCQB9fk](https://youtu.be/s92JCCQB9fk). Исходный пост: [t.me/danokhlopkov/1606](https://t.me/danokhlopkov/1606).

## Что было в исходном посте

В закрытом чатике пришла идея написать `llms.txt` по разработке Telegram Mini App с нуля, чтобы упростить онбординг в экосистему.

Я собрал ссылки на доки, нужные библиотеки и best practices в одном месте:

- [github.com/ohld/tma-llms-txt](https://github.com/ohld/tma-llms-txt)

Потом провели стрим, где я с нуля сделал, задизайнил и задеплоил простую игру:

- app: [t.me/gtrendbot](https://t.me/gtrendbot)
- code: [github.com/ohld/tic-tac-tma](https://github.com/ohld/tic-tac-tma)
- video: [youtu.be/s92JCCQB9fk](https://youtu.be/s92JCCQB9fk)

Обсудили генерацию TMA не глядя в код, автодеплой на Vercel и дизайн через Variant.

## Зачем тут llms.txt

`llms.txt` — это не магический файл для индексации и не замена документации. Это короткая markdown-карта для LLM: что за проект, какие страницы читать первыми и какие ссылки можно пропустить, если контекст ограничен.

В разработке это особенно полезно. У Telegram Mini Apps много деталей, которые AI легко путает: `initData`, подпись, viewport, запуск из клиента Telegram, отличия WebView от обычного браузера. Если агент читает случайные статьи, он собирает случайную миниаппку. Если дать source pack, шанс получить рабочий skeleton выше.

## Source pack для TMA

Минимальный набор для агента:

| Блок | Что положить | Зачем |
| --- | --- | --- |
| Официальные docs | [Telegram Mini Apps](https://core.telegram.org/bots/webapps), [docs.telegram-mini-apps.com](https://docs.telegram-mini-apps.com/platform/init-data) | Чтобы не фантазировать API |
| Auth | `initData`, подпись, проверка на backend | Без этого нельзя доверять пользователю |
| UI | viewport, theme params, main/back/settings buttons | Mini App живет в Telegram WebView |
| SDK | `@tma.js/sdk` или выбранная библиотека | Чтобы агент не писал сырой glue-код |
| Деплой | Vercel/Vite/static hosting | TMA должен открываться по HTTPS |
| Примеры | маленькое готовое приложение | Агентам проще копировать структуру |

## Как я бы делал Telegram Mini App с агентом

1. Создать репу с Vite/React или другим простым фронтом.
2. Добавить `llms.txt` или `docs/agent-source-pack.md` с нужными ссылками.
3. Дать агенту задачу: “собери минимальную TMA, не делай backend, используй mock initData для локалки”.
4. Отдельным шагом попросить добавить Telegram SDK и обработать viewport/theme.
5. Отдельным шагом добавить backend-проверку `initData`, если нужна авторизация.
6. Задеплоить на HTTPS и прописать URL в BotFather.
7. Проверить в Telegram-клиенте, а не только в браузере.

Не надо просить “сделай продукт”. Сначала делайте маленькую работающую штуку. В моем случае это были крестики-нолики.

## Что ломается чаще всего

| Проблема | Симптом | Что делать |
| --- | --- | --- |
| Проверяли только в браузере | В Telegram все едет | Тестировать внутри Telegram с самого начала |
| Не валидировали `initData` | Любой может подменить user | Проверять подпись на сервере |
| Перепутали `initData` и `initDataUnsafe` | Backend доверяет небезопасным данным | На сервер отправлять raw `initData` и валидировать |
| Viewport не учтен | Кнопки и нижняя часть UI прячутся | Использовать Telegram viewport/events, не только CSS `100vh` |
| Нет HTTPS | Mini App не открывается нормально | Деплоить на Vercel/Cloudflare/другой HTTPS-хостинг |
| Агент читал старые статьи | API не совпадает с текущими docs | Давать source pack с актуальными ссылками |

## Безопасность initData

Самая важная практическая деталь: Telegram прямо предупреждает, что `initDataUnsafe` нельзя доверять. Надежный путь — отправить raw `Telegram.WebApp.initData` на backend и проверить подпись.

Если совсем коротко, сервер должен:

1. Получить raw init data.
2. Исключить `hash`, остальные пары отсортировать.
3. Собрать data-check-string.
4. Посчитать HMAC с bot token через `WebAppData`.
5. Сравнить результат с `hash`.
6. Проверить свежесть `auth_date`, если это важно.

Эту часть лучше не “вайбкодить на глаз”. Дайте агенту официальную ссылку и попросите покрыть проверку тестами.

## Что добавилось из обсуждений

В обсуждениях вокруг Mini Apps люди обычно хотят не теорию, а runnable example: какой stack взять, что положить в docs pack, где деплоить, как проверить в Telegram. Поэтому главный reusable вывод здесь такой: агенту нужен не длинный промпт, а короткая папка с правильными ссылками и ограничениями.

Еще один паттерн из чата: когда данных много или документация расползается, выигрывает не “самая умная модель”, а harness. Сначала режем контекст на понятные блоки, потом даем правила, потом проверяем результат в реальной среде.

## Почему это хороший формат для vibe coding

Telegram Mini App — идеальный маленький полигон:

- ограниченная поверхность API;
- быстрый визуальный результат;
- деплой за минуты;
- есть настоящие constraints: WebView, auth, Telegram UI;
- можно сразу отправить друзьям в чат.

Но именно поэтому легко получить красивую игрушку, которая небезопасна или работает только в dev-браузере. Сначала skeleton, потом проверка Telegram-specific частей, потом красота.

## Карта интентов

Для запроса `telegram mini app claude code` человеку нужен практический маршрут:

| Интент | Что дать |
| --- | --- |
| “Как сделать Telegram Mini App с AI?” | Source pack + пошаговый build flow |
| “Что такое llms.txt для TMA?” | Короткая карта доков для агента |
| “Почему mini app не работает в Telegram?” | Viewport, HTTPS, BotFather, initData |
| “Как безопасно авторизовать user?” | Проверка подписи `initData` на сервере |

## FAQ

### Можно ли сделать Telegram Mini App полностью через Claude Code?

Да, маленький прототип можно. Но агенту нужно дать Telegram-specific контекст: official docs, SDK, viewport, initData и деплой. Без этого он часто сделает обычное web-приложение, которое “почти” работает.

### llms.txt обязателен для Mini Apps?

Нет. Это удобный формат source pack для LLM, а не требование Telegram. Можно сделать тот же эффект файлом `agent-docs.md`, но `llms.txt` хорошо подходит как публичная карта доков.

### Где тестировать Mini App?

В Telegram-клиенте. Браузер подходит для UI-итераций, но не ловит все проблемы WebView, launch params, viewport и Telegram API.

### Нужен ли backend?

Для игрушки без авторизации можно начать без backend. Если вы доверяете пользователю, платежам, профилю или прогрессу, нужен backend и проверка `initData`.

### Что дать AI-агенту первым промптом?

Дайте цель, stack, source pack и ограничения: “собери минимальный TMA на Vite/React, используй Telegram SDK, не добавляй backend, сделай mock для локального запуска, опиши как проверить в Telegram”.

## Читать ещё

- [AI-агенты: с чего начать в 2026](/blog/ai-agents-s-chego-nachat/)
- [Мой AI-сетап 2026: Claude Code, Cursor, Ghostty, Spokenly](/blog/my-ai-setup-2026-claude-code-cursor-spokenly-ghostty/)
- [Claude Code vs Codex: почему я на две недели перешёл на Codex](/blog/claude-code-vs-codex-perehod/)
- [Что попросить AI-агента сделать, когда очевидные задачи закончились](/blog/improve-codebase-architecture-prompt/)
