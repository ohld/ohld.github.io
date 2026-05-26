# Claude Code + Codex Dual Review: How Two AI Agents Cross-Check Each Other's Plans

# Claude Code + Codex Dual Review: How Two AI Agents Cross-Check Each Other's Plans

> How to set up cross-validation between Claude Code and OpenAI Codex via MCP. Step-by-step Dual Review protocol with prompt examples.

Source: https://okhlopkov.com/en-claude-codex-dual-review/

👨 Claude + Codex combo: Dual Review 👩 Why Use Two AI Agents Together? Turns out I have 2 subscriptions: Claude Code at $100 and ChatGPT at $20. Didn't want Codex sitting idle, so I started researching combos. @vlad_shlapakov suggested: you can connect Codex as a tool via codex MCP. How to Set Up Dual Review in Claude Code Paste this into your CLAUDE.md and at the end of every plan mode, your plan gets sent to Codex for cross-review. Step 1: First Codex Call mcp__codex__codex( prompt: "Review this implementation plan. ## Plan [plan contents] ## Questions 1. Are there gaps in the plan? 2. What could go wrong? 3. Is there a better approach? Return JSON: {verdict: APPROVED|NEEDS_REVISION, concerns, suggestions, missedCases}", approval-policy: "never", sandbox: "read-only" ) Step 2: Handle Response APPROVED → ExitPlanMode NEEDS_REVISION → Accept/Reject suggestions → codex-reply with updated plan Step 3: Exit Conditions verdict: APPROVED Consensus reached (no new blocking concerns) Max 3 cycles → present final plan to user with discussion history Pro Tips Don't want to bloat your Claude.md ? Save it in a separate file and reference it with 1 line. Misha even turned it into a skill. Does It Actually Help? I love that now different agents check each other's work, often debating back and forth, increasing "useful work" time. Hard to say definitively if it's better, but I've definitely noticed my manual corrections are decreasing. I especially like using this not for coding tasks, but more for creative ones. Especially when the project already has tons of notes, specs, and docs in .txt files.

