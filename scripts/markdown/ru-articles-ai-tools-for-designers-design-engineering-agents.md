# AI-инструменты для дизайнеров: design engineering, агенты и Figma-to-code

> Разбор стрима про design engineering: как дизайнерам работать с AI-агентами, почему появляется AI-slop, зачем нужны design tokens, Figma MCP, Paper, Mobbin MCP и хороший контекст для Codex/Claude Code.

Last updated: 2026-06-19

![YouTube thumbnail: ИИ не вывозит норм дизайн или это skill issue?](https://i.ytimg.com/vi/fIEMOzz0_AI/maxresdefault.jpg)

[Открыть на YouTube](https://www.youtube.com/watch?v=fIEMOzz0_AI)

- Дизайнеру уже мало просто рисовать в Figma: ценность сдвигается к prototype-first и code-aware работе.
- [AI-агентам](/topics/ai-agents/) нужны нормальные design skills: tokens, states, references, constraints и критерии вкуса.
- Главный враг — AI-slop: generic карточки, случайные gradients, непонятная иерархия и отсутствие живого feedback.

## Что реально поменялось

AI меняет скорость макетов и требования к роли дизайнера. Ценнее становится человек, который умеет соединять вкус, продуктовую задачу и код.

[Design engineer](/topics/design-engineering/) здесь — роль на стыке: быстро собрать прототип, понять ограничения интерфейса, дать агенту нормальные skills и довести идею ближе к работающему продукту.

> Команда «сделай красиво» почти всегда проигрывает нормальным skills, дизайн-токенам и правилам визуального стиля.

## Почему агенты делают AI-slop

[Codex](/topics/codex/), [Claude Code](/claude-code-nastrojka-mcp-hooks-skills-2026/), Lovable, v0 и похожие инструменты умеют быстро собрать интерфейс. Проблема в том, что без ограничений они тянут усреднённый интернет: одинаковые карточки, случайную типографику, декоративные блоки и визуальный шум.

Практический вывод: агенту нужен язык дизайна вместе с задачей: семантические токены, состояния компонентов, анти-референсы, примеры хороших flow и критерии, по которым результат считается готовым.

## Инструменты и где они полезны

| Инструмент | Для чего | Риск |
|---|---|---|
| [Paper](https://paper.design/) | Design-to-code и импорт живых сайтов ближе к HTML/CSS модели. | Нужны продуктовая логика и responsive states. |
| [Figma MCP](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) | Дать Claude Code доступ к выбранному фрейму, компонентам и layout-данным прямо из Figma. | Нужен Dev Mode/доступ к файлу; нельзя тащить приватные клиентские макеты в агент без правил. |
| [Mobbin MCP](https://mobbin.com/mcp) | Реальные UX-референсы для onboarding, paywall, checkout, settings. | Можно скопировать паттерн без понимания контекста. |
| [Codex / Claude Code](/ru/blog/claude-code-vs-codex-perehod/) | Сборка route, ревью, перенос UI в код, работа с существующим проектом. | Без дизайн-системы быстро скатываются в generic UI. |

## Figma MCP + Claude Code: когда это полезнее Figma-to-code

**Figma MCP полезнее Figma-to-code, когда надо не «сконвертить экран», а дать агенту нормальный контекст.** Claude Code видит выбранный фрейм, имена слоёв, размеры, компоненты и может аккуратнее перенести intent в живой код. И ХОБА: дизайнер остаётся владельцем вкуса, а агент перестаёт угадывать интерфейс по скриншоту.

Минимальный сетап такой:

1. Включить [Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) в Figma Dev Mode и открыть нужный файл/фрейм.
2. Подключить его в [Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp) как обычный MCP server.
3. Дать агенту задачу не «сделай красиво», а: вот фрейм, вот route, вот design tokens, вот forbidden slop.
4. После генерации прогнать mobile/desktop и руками проверить иерархию, states и privacy.

Главный caveat: Figma MCP — это мост к контексту, а не дизайнер в коробке. Если в макете хаос, агент просто быстрее перенесёт хаос в код. Если файл клиентский или NDA-sensitive, сначала реши, какие фреймы и токены можно отдавать агенту, а что надо вырезать.

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

Для более жесткого вкусового слоя можно взять [Agents with Taste skill](https://github.com/emilkowalski/skill) и адаптировать его под проект.

1. Собрать `design.md` для проекта: tokens, typography, spacing, radius, components, anti-patterns.
2. Для каждого нового UI task давать агенту задачу, референсы и правила визуального стиля.
3. Проверять mobile/desktop, empty/loading/error states и микроинтеракции до финала, особенно если в проекте уже есть [дизайн-система](/articles/markdown-vs-html/) или хотя бы живой HTML-прототип.
4. Для Figma-heavy задач держать отдельный [Claude Code setup](/claude-code-nastrojka-mcp-hooks-skills-2026/) и не смешивать MCP-доступ, промпты и секреты в одном файле.
5. Сохранять созвоны, решения и дизайн-обсуждения как будущую [память для агентов](/vtoroj-mozg-ai-assistent-obsidian-claude-code/).

## FAQ

### Figma MCP для Claude Code — это замена Figma-to-code?

Нет. Figma-to-code пытается сразу сделать код из макета, а Figma MCP даёт Claude Code структурный контекст: фрейм, слои, компоненты и размеры. Это лучше, когда у тебя уже есть проект, дизайн-система и надо аккуратно перенести intent, а не получить одноразовый HTML.

## Source pack

- [YouTube-запись стрима](https://www.youtube.com/watch?v=fIEMOzz0_AI)
- [Paper](https://paper.design/) и [Paper MCP](https://paper.design/docs/mcp)
- [Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)
- [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Mobbin MCP](https://mobbin.com/mcp)
- [Agents with Taste skill](https://github.com/emilkowalski/skill)

## Читать ещё

- [Все статьи](/ru/articles/)
- [Блог](/ru/blog/)
- [Мой сетап Claude Code 2026](/claude-code-nastrojka-mcp-hooks-skills-2026/)
- [Лучшие skills и MCP для Claude Code](/luchshie-skills-mcp-claude-code-agent-browser/)
