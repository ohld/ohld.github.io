---
slug: bot-revolution
title: The Bot Revolution
description: The next step in AI tools is not one agent, but an entire team.
publishedAt: 2026-08-26
updatedAt: 2026-08-26
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

Experienced AI developers already know this: you can’t fit every project into one context. But you still want a `single point of contact`: message a Chief of Staff, have it load the right context, solve the problem, and delegate the work to subagents.

[Grok Bot](https://t.me/ohld_chat/45534), [Hermes Bot](https://t.me/ohld_chat/45546), and [Berd](https://t.me/danokhlopkov/1731) almost simultaneously shipped a new way to work with agents: DMs and group chats, employees, and loops.

One of those loops looks like this:

`bug → Sentry → fix → PR → review → CI green → deploy → bug`

[I covered this kind of agent loop on my Paperclip stream](https://t.me/danokhlopkov/1659).

## Not one super-agent, but actual division of labor

One agent researches, one codes, one reviews. The Chief remembers what we’re trying to do and pulls in the right specialist. The context no longer becomes one endlessly expensive tab with amnesia.

The interface is still raw, and Grok Bot may well fail. But the idea has already shifted from “open another chat” to “build me a team.”

Greenfield development is still easier in Claude Code, Codex, or Grok CLI. Grok Bot and Hermes are more interesting on a live project: keeping prod running, discussing features, and shipping small fixes.

People in [OHLD Chat](https://t.me/ohld_chat/45541) told me the bots can still get stuck in loops without producing a useful result. Building a Hermes for SMM is hard both technically and as a product: you need to glue the system together and teach people that they can work with a bot like they would with a person.

## You can organize it like a small company

One Chief sees every project and keeps the shared board. The other bots work within their own functions.

In a DM, one bot holds the context. In a [group chat](https://docs.x.ai/grok-bot/chat-and-collaboration), you bring 2–6 bots around one shared task: they see the same conversation, post on their own, and hand work to one another.

The Chief has one hourly routine: open the shared board, check every task, and continue anything that stopped. No need to wake each bot separately and burn tokens in every chat.

This is already close to how I work. I start cross-project and personal requests from my iCloud folder — it’s the single entry point. Codex goes into the right project folders, delegates work to subagents, and assembles the answer.

Tasks often take more than one session. But saved work stays in the project, and [GBrain](https://t.me/danokhlopkov/1685) brings back past decisions and results. So every new request starts where we left off.

## Telegram already has almost all the primitives

[Topics](https://core.telegram.org/bots/features#topics-in-private-chats). [Bot-to-bot](https://core.telegram.org/bots/features#bot-to-bot-communication). [Managed Bots](https://core.telegram.org/bots/features#managed-bots).

But you still can’t put a hundred employees under one account: [BotFather caps you at 20 bots, or 40 with Premium](https://core.telegram.org/api/config#bots-create-limit-default).

Which is why I’m especially curious to see what [Fabrika](https://t.me/karfly_livestream/293) ships.

## So how much does it cost?

You can try Grok Bot with [Cursor Pro+ for $60](https://cursor.com/pricing) or [SuperGrok Plus for $100](https://x.ai/pricing). [SuperGrok Heavy costs $300](https://x.ai/bot): it comes with the highest limits for Chat, Imagine, Voice, Build, and bots.

$300 stings more than the top Codex and Claude Code plans at $200. The $100 limits are already too tight for me, so I’m going straight to $300. Time to try getting that reimbursed 👹

## Ask the agent that already knows you

> Based on what you know about me, how would you set up GrokBot? Which bots should we set up?

[Prompt from the video](https://www.youtube.com/watch?v=vrgO4D_mUlA&t=667s). You can use it to find your own agent loops too: routines that should already belong to a bot.

The next revolution won’t come from smarter models.

It will come from how we work with them.

**Follow along**

Explore more in the English [Blog](/en/blog/) and [Articles](/en/articles/).
