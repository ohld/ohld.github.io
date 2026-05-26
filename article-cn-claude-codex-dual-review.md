# Claude Code + Codex双重审查：两个AI代理如何交叉检查彼此的计划

# Claude Code + Codex双重审查：两个AI代理如何交叉检查彼此的计划

> 如何设置Claude Code和OpenAI Codex之间通过MCP的交叉验证。带提示词示例的双重审查协议。

Source: https://okhlopkov.com/cn-claude-codex-dual-review/

👨 Claude + Codex组合：双重审查 👩 双重审查协议 通过codex MCP将Codex连接为工具。将以下内容粘贴到CLAUDE.md中，每次计划模式结束时，计划会发送给Codex进行交叉审查。 协议步骤 1. 首次调用： 将计划发送给Codex审查，要求返回JSON：{verdict: APPROVED|NEEDS_REVISION} 2. 处理响应： • APPROVED → 退出计划模式 • NEEDS_REVISION → 接受/拒绝建议 → 更新计划重新提交 3. 退出条件： 达成共识或最多3轮循环。 实际效果 不同代理互相检查，经常来回讨论，增加"有效工作"时间。我的手动修正明显减少了。特别喜欢在创意任务中使用，而不是编码任务。

