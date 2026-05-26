# How to Write Claude Code Skills Properly: 7 Common Mistakes to Avoid

# How to Write Claude Code Skills Properly: 7 Common Mistakes to Avoid

> 7 mistakes that break Claude Code skills: no trigger, generic names, empty sections, verbose triggers. Checklist for a good skill file.

Source: https://okhlopkov.com/en-write-claude-code-skills-7-mistakes/

How to write Claude Code skills properly Thanks to the chat for this guide : 7 common mistakes that break your skill: 7 Skill Mistakes 🔺 No trigger — Claude doesn't know WHEN to call the skill. Write "use when asked to deploy", not "helps with deployment". 🔺 No specific action verbs — "works with files" is vague. Write create, generate, convert, analyze. 🔺 Generic names — skill, helper, utils. Better: github-pr-reviewer, dev-browser. 🔺 Empty sections — a heading with no content wastes tokens. No content — delete the section. 🔺 Verbose triggers — "This skill should be used when the user wants to" → just "Use when…" Every extra token costs money. 🔺 No output format — the skill should know what to return: json, md, plain text. With an example. 🔺 Contradictions — "always use TypeScript" and "support any language" in the same file. Formula for a Good Skill Good skill = clear name + when to trigger + what to do + output format. Don't fill context with garbage — you still need room for your own prompts.

