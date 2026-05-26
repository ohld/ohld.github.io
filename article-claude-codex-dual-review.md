# Связка Claude Code + Codex: как два AI агента проверяют план друг друга

# Связка Claude Code + Codex: как два AI агента проверяют план друг друга

> Как настроить кросс-проверку планов между Claude Code и OpenAI Codex через MCP. Пошаговый протокол Dual Review с примерами промптов.

Source: https://okhlopkov.com/claude-codex-dual-review/

👨 связка Claude + Codex: Dual Review 👩 Так оказалось, что у меня 2 подписки: 👟 для него — Claude Code за $100 👟 и для нее — ChatGPT за $20 Не хотел, чтобы кодекс простаивал, стал рисерчить связки. @vlad_shlapakov подсказал: можно подключить codex как тул через codex mcp. Вставьте это в CLAUDE.md и в конце каждого plan mode план будет кидаться на кросс-проверку в codex: Dual Review: Claude + Codex In plan mode ALWAYS run Codex review before ExitPlanMode. Protocol 1. First call: mcp__codex__codex( prompt: "Review this implementation plan. ## Plan [plan contents] ## Questions 1. Are there gaps in the plan? 2. What could go wrong? 3. Is there a better approach? Return JSON: {verdict: APPROVED|NEEDS_REVISION, concerns, suggestions, missedCases}", approval-policy: "never", sandbox: "read-only" ) 2. Handle response: • APPROVED → ExitPlanMode • NEEDS_REVISION → Accept/Reject suggestions → codex-reply с обновлённым планом 3. Exit conditions: • verdict: APPROVED • Консенсус (нет новых блокеров) • Max 3 цикла → финальный план пользователю с историей дискуссии Не хотите раздувать Claude.md ? Я сохранил в другой файл и сослался на него в Claude.md 1 строчкой. А Миша из этого сделал скилл. Мне нравится, что теперь разные агенты друг друга проверяют, часто дискутируют туда-сюда, увеличивая время "полезной работы". Трудно явно сказать, стало ли лучше, но я точно заметил что моих правок становится меньше. Особено мне нравится использовать это не в кодинговых, а более в креативных задачах. Особенно когда в проекте уже куча мыслей, заметок, спеков и доков записано в .txt.

