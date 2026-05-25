# AI-инструменты для дизайнеров: design engineering, агенты и Figma-to-code

> Разбор стрима про design engineering: как дизайнерам работать с AI-агентами, почему появляется AI-slop, зачем нужны design tokens, Paper, Mobbin MCP и хороший контекст для Codex/Claude Code.

Last updated: 2026-05-25

![YouTube thumbnail: ИИ не вывозит норм дизайн или это skill issue?](https://i.ytimg.com/vi/fIEMOzz0_AI/hqdefault.jpg)

YouTube source: [ИИ не вывозит норм дизайн или это skill issue?](https://www.youtube.com/watch?v=fIEMOzz0_AI)

## Коротко

- Дизайнеру уже мало просто рисовать в Figma: ценность сдвигается к prototype-first и code-aware работе.
- AI-агентам нужен не магический промпт, а контекст: tokens, states, references, constraints и критерии вкуса.
- Главный враг — AI-slop: generic карточки, случайные gradients, непонятная иерархия и отсутствие живого feedback.

## Что реально поменялось

Разговор был не про то, что AI «заменит дизайнеров». Скорее наоборот: становится ценнее человек, который умеет соединять вкус, продуктовую задачу и код.

Design engineer — это не фронтендер с красивыми кнопками и не дизайнер, который случайно открыл Cursor. Это роль на стыке: быстро собрать прототип, понять ограничения интерфейса, дать агенту нормальный контекст и довести идею ближе к работающему продукту.

> Команда «сделай красиво» почти всегда проигрывает хорошему контексту.

## Почему агенты делают AI-slop

Codex, Claude Code, Lovable, v0 и похожие инструменты умеют быстро собрать интерфейс. Проблема в том, что без ограничений они тянут усреднённый интернет: одинаковые карточки, случайную типографику, декоративные блоки и визуальный шум.

Практический вывод: агенту нужно дать не только задачу, но и язык дизайна: семантические токены, состояния компонентов, анти-референсы, примеры хороших flow и критерии, по которым результат считается готовым.

## Инструменты и где они полезны

| Инструмент | Для чего | Риск |
|---|---|---|
| Paper | Design-to-code и импорт живых сайтов ближе к HTML/CSS модели. | Не заменяет продуктовую логику и responsive states. |
| Mobbin MCP | Реальные UX-референсы для onboarding, paywall, checkout, settings. | Можно скопировать паттерн без понимания контекста. |
| Codex / Claude Code | Сборка route, ревью, перенос UI в код, работа с существующим проектом. | Без дизайн-системы быстро скатываются в generic UI. |

## Промпт, который можно дать агенту

```prompt
Ты помогаешь сделать frontend экран не похожим на AI-slop.

Контекст:
- пользователь: [кто открывает экран]
- задача: [что он должен сделать]
- продуктовый риск: [что нельзя сломать]
- референсы: [2-5 ссылок или описаний]

Правила:
1. Используй semantic tokens: text-primary, text-secondary, bg, surface-100, border, accent.
2. Покажи empty/loading/error/success states.
3. Не добавляй декоративные карточки без функции.
4. Добавь micro-interactions только там, где они дают feedback.
5. Перед финалом проверь mobile и desktop viewport.
```

## Что делать дальше

1. Собрать `design.md` для проекта: tokens, typography, spacing, radius, components, anti-patterns.
2. Для каждого нового UI task давать агенту не только задачу, но и референсы.
3. Проверять mobile/desktop, empty/loading/error states и микроинтеракции до финала.
4. Сохранять созвоны, решения и дизайн-обсуждения как будущую память для агентов.

## Source pack

- [YouTube-запись стрима](https://www.youtube.com/watch?v=fIEMOzz0_AI)
- [Paper](https://paper.design/) и [Paper MCP](https://paper.design/docs/mcp)
- [Mobbin MCP](https://mobbin.com/mcp)
- [Agents with Taste skill](https://github.com/emilkowalski/skill)

## Дальше по теме

- [Все SEO-статьи](/articles/)
- [Блог из Telegram-постов](/blog/)
- [Мой сетап Claude Code 2026](/claude-code-nastrojka-mcp-hooks-skills-2026/)
- [Лучшие skills и MCP для Claude Code](/luchshie-skills-mcp-claude-code-agent-browser/)
