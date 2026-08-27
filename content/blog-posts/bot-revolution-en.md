---
slug: bot-revolution
title: The Bot Revolution
description: The next step in AI tools is not one agent, but an entire team.
publishedAt: 2026-08-26
updatedAt: 2026-08-27
lang: en
readingTime: 7 min
tags: AI Agents, Grok Bot, Hermes Bot, Telegram
coverImage: /assets/drafts/bot-revolution/bot-weather-map.webp
coverAlt: The Bot Revolution — a weather map for a distributed team of AI bots
sourceTelegramId:
primaryKeyword: AI agent teams
secondaryKeywords: Grok Bot; Hermes Bot; Chief of Staff; agent loops; AI team
views: 0
forwards: 0
comments: 0
reactions: 0
---

The long-awaited next step in AI evolution.

You don’t need one agent. You need a whole team.

## A short timeline of AI revolutions

- **2023 — ChatGPT.** AI searches better.
- **2024 — Cursor.** AI helps you code.
- **2025 — Claude Code.** AI codes better.
- **2026 — OpenClaw.** AI plugs into services.
- **2026.5 — The Bot Revolution.** AI becomes a team.

## You can’t cram everything into one session

Experienced AI developers already know this: you can’t fit data from every project into one context. But you still want a `single point of contact`: message a Chief of Staff, have it load the right context, solve the problem, and delegate the work to subagents.

[Grok Bot](https://t.me/ohld_chat/45534), [Hermes Bot](https://t.me/ohld_chat/45546), and [Berd](https://t.me/danokhlopkov/1731) almost simultaneously shipped a new way to talk to AI: DMs, group chats, employees, and loops.

One of those loops looks like this:

`bug → Sentry → fix → PR → review → CI green → deploy → bug`

[I covered this kind of agent loop on my Paperclip stream](https://t.me/danokhlopkov/1659).

## Not one super-agent, but actual division of labor

At first, all of this lived in one chat with a pile of Markdown files. Then you packaged the workflows into [skills](https://t.me/danokhlopkov/1725), automating one slice of work at a time. That’s what I did with [TON Blockchain data analysis](https://t.me/danokhlopkov/1618).

Now a new wave of AI IDEs wants to turn those workflows into separate employees. Each gets its own context and responsibilities.

The interesting bit in Grok Bot is the interface: Telegram or Slack, except the coworkers are agents and they can talk to each other.

For actual coding, Codex, Claude Code, and Cursor still win. But maintaining code and automating ops is cognitively easier in the painfully familiar boss → direct report setup.

People in [OHLD Chat](https://t.me/ohld_chat/45541) told me the bots can still get stuck in loops without producing a useful result. Building a Hermes for SMM is hard both technically and as a product: you need to glue the system together and teach people that they can work with a bot like they would with a person.

## You can organize it like a small company

When you create a QA agent, you give it its own context: code, tests, bugs, releases, plus custom CLI and MCP tooling for debugging prod. A marketer probably needs none of that.

Even in a two-person startup, one founder usually takes tech and the other sales. Different contexts, cleaner ownership.

A Chief of Staff sits above them. It sees every project, keeps the shared board, and sends tasks to the right person. In a [group chat](https://docs.x.ai/grok-bot/chat-and-collaboration), you pull in 2–6 bots around one job. They share the same thread, post on their own, and hand work to each other. This is the setup that went viral on Twitter.

The Boss has one hourly ritual: check the status and restart whatever stalled. No need to wake every employee one by one. It micromanages the rest for you.

## Telegram already has almost all the primitives

[Topics](https://core.telegram.org/bots/features#topics-in-private-chats). [Bot-to-bot](https://core.telegram.org/bots/features#bot-to-bot-communication). [Managed Bots](https://core.telegram.org/bots/features#managed-bots).

But you still can’t put a hundred employees under one account: [BotFather caps you at 20 bots, or 40 with Premium](https://core.telegram.org/api/config#bots-create-limit-default).

Which is why I’m especially curious to see what [Fabrika](https://t.me/karfly_livestream/293) ships.

## So how much does it cost?

I’m probably getting [SuperGrok Heavy for $300](https://x.ai/bot): [the highest Grok Bot limits come with it](https://cursor.com/help/grok-bot/plans). That means I can code properly with Grok CLI and automate ops in a familiar chat UI.

$300 stings more than the top Codex and Claude Code plans at $200. But I keep hitting the ceiling on $100 plans. I’m waiting for my Codex limits to finally run out so I can give Grok my money. Except [Tibo](https://t.me/ohld_chat/45884) keeps resetting them. Lol.

## Do I actually want a team like this?

Human org charts may be a weird fit for AI agents. Still, they work, so that’s a decent place to start.

[Django co-creator Simon Willison](https://x.com/simonw/status/2075996740717871125?s=20) thinks the whole “AI employee” idea demeans humans (lol). Still, you need a human manager. Someone has to own the outcome.

[Bill Gates recently wrote](https://www.gatesnotes.com/home/home-page-topic/reader/a-turbulent-ai-era-and-critical-choices-to-make) that AI tokens and robots should be taxed. I’m happy to pay if a $300/month team ever replaces a $3,000/month employee. I just don’t know what gets taxed: the tokens, the output, or the salary I no longer pay.

## Ask the agent that already knows you

> Based on what you know about me, how would you set up GrokBot? Which bots should we set up?

[Prompt from the video](https://www.youtube.com/watch?v=vrgO4D_mUlA&t=667s). You can use it to find your own agent loops too: routines that should already belong to a bot.

The next revolution won’t come from smarter models.

It will come from how we work with them.

**Follow along**

Explore more in the English [Blog](/en/blog/) and [Articles](/en/articles/).
