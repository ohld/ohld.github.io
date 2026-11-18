---
slug: telegram-bot-trends-november-2026
lang: en
title: Which Telegram bot categories grew in the 30 days to November 17, 2026?
description: I tracked ten lists of Telegram bots from October 18 to November 17, 2026. For AI assistants, I measured the gain with and without the biggest contributor.
publishedAt: 2026-11-18
updatedAt: 2026-11-18
readingTime: 4 min
tags: Telegram, Telegram Bots, Mini Apps, Data Analytics
sourceTelegramId: 0
primaryKeyword: Telegram bot trends November 2026
---

Between October 18 and November 17, 2026, the monthly profile counters of 20 Telegram AI bots rose from a combined 8.20 million to 13.30 million. Removing the largest contributor still left the AI bots up 1.51 million, while the same test turned a small VPN gain into a loss.

## Which lists gained or lost audience?

The two largest measured gains in ten October lists came from AI assistants and sellers of Telegram Stars. VPNs offer a comparison. One person can appear in several counters.

| List | MAU, M | Δ, M | Rising¹ |
| --- | --- | --- | --- |
| AI bots | 8.20 → 13.30 | +5.10 | 11/20 |
| Stars | 3.42 → 8.21 | +4.79 | 38/58 |
| VPN | 17.52 → 17.66 | +0.15 | 138/305 |

¹ Figures in millions of bot MAU, October 18 → November 17, 2026, UTC. Rising / matched profiles. Source: Daniil Okhlopkov, OHLDBot.

The 305 VPN profiles with both readings gained 146,512 in total. One bot added 176,421, more than the whole list gained. Without it, the remaining counters slipped from 17,473,382 to 17,443,473, a loss of 29,909.

## How much of the AI gain came from one product?

An October menu for @gpt4telegrambot offered text, images, video and music. Its profile counter climbed from 2,689,181 to 6,276,400. That single profile accounted for 3,587,219 of the 5,101,094 gain. Take it out of both dates and the other bots still added 1,513,875, or 27.5% of their own starting total.

![Change in monthly profile counters for 20 AI bots: up 5,101,094 overall and 1,513,875 without the largest contributor.](/assets/articles/telegram-bots-mini-apps-trends-november-2026/change-en.webp)

Monthly profile counters, OHLDBot, October 18 and November 17, 2026, UTC.

| Date | All 20 | Without leader |
| --- | --- | --- |
| Oct 18 | 8,198,413 | 5,509,232 |
| Nov 17 | 13,299,507 | 7,023,107 |
| Change | +62.2% | +27.5% |

Two bots identify Unlim as their owner. Combining that pair leaves 19 entries, of which 11 grew. Some of the other bots may also share an owner.

[Follow Dan’s Telegram bot research](https://t.me/danokhlopkov)

## Where the numbers come from

I froze the lists from the October 7 report, keeping small bots and those that subsequently lost users. Services added later fall outside this comparison.

OHLDBot reads public Telegram profiles. I matched permanent IDs across dates and kept displayed zeroes. A hidden counter or a missed reading removed that bot from both totals. Across the ten lists, 1,399 distinct bots had both readings.

| List | Bots | Hidden | Missing |
| --- | --- | --- | --- |
| AI bots | 20/23 | 0 / 0 | 0 / 1 |
| Stars | 58/59 | 1 / 0 | 0 / 1 |
| VPN | 305/317 | 3 / 0 | 2 / 11 |

“Bots” shows matched profiles out of the original list. Hidden and missing counts are for October 18 / November 17. I excluded a proxy and an unverified service from the 23 AI candidates. One of the remaining 21 lacked a November reading. Its last count, 394,798, was larger than the gap between the top two gains. I dropped the AI video list from the comparison after finding a water meter service in it.

In the [August edition](/en/articles/telegram-bot-trends-august-2026/) I followed 16 bots that ran games with Telegram gifts. The October list covers a wider range of gift and case services. Its November total cannot tell us whether those original 16 continued to grow.

## What can you read from a bot profile?

**How many people were new?** Telegram displays monthly active users for a bot. One returning user can offset another whose last visit drops out of the monthly window. You need activity records to separate first-time visitors from people coming back. Telegram can also leave the field empty for small bots.

**Can you count Mini App users this way?** The profile gives one figure for the bot. It has no separate line for opening its Mini App. To measure app openings, count launches inside the app. For examples, see my [guide to Telegram’s bot interfaces](/en/blog/bot-revolution/).
