---
slug: telegram-bot-api-vs-mtproto-methods
lang: en
title: Telegram Bot API vs MTProto: Methods Available to Bots
description: Which MTProto methods can Telegram bots call? A production-tested Bot API comparison with bot-token methods, user-only limits, and Telethon examples.
publishedAt: 2026-07-19
updatedAt: 2026-07-19
readingTime: 8 min
tags: Telegram, Telegram Bot API, MTProto, Telethon, Python
coverImage: /assets/articles/telegram-bot-api-vs-mtproto-methods/telegram-bot-api-mtproto-cover.webp
coverAlt: Telegram Bot API versus MTProto cover showing that the Bot API is not the limit
sourceTelegramId: 0
primaryKeyword: telegram bot api vs mtproto
secondaryKeywords: telegram bot mtproto; mtproto methods available to bots; telethon bot token; channels getParticipants bot; telegram get message by id bot
views: 0
comments: 0
forwards: 0
reactions: 0
---

## Quick answer

A BotFather token is not limited to the HTTP Bot API. The same token can authorize an MTProto session, giving a bot access to native Telegram methods for participant enumeration, profile enrichment, and explicit message retrieval by ID.

I ran into this boundary while building OHLDBot. The HTTP Bot API handled normal bot interactions, but it did not expose the participant and profile workflow I needed. A bot-token MTProto session did.

The extra surface is precise and limited. Many tempting methods still return `BOT_METHOD_INVALID`. This guide separates methods verified in production, methods tested in a live probe, methods confirmed only by Telegram's documentation, and methods that remain user-only.

## Bot API and MTProto are different interfaces

The **HTTP Bot API** is the standard web interface. Webhooks, `getUpdates`, `sendMessage`, `getChat`, file IDs, keyboards, and payments. It is the right abstraction for chat-oriented bots.

**MTProto** is Telegram's native client protocol. A bot can authenticate to it using its BotFather token:

```python
from telethon import TelegramClient

client = TelegramClient("bot-session", API_ID, API_HASH)
await client.start(bot_token=BOT_TOKEN)

me = await client.get_me()
assert me.bot
```

Telethon wraps `auth.importBotAuthorization` here. You still need an `api_id` and `api_hash` in addition to the BotFather token. The token alone does not give you an MTProto session.

This does **not** turn the bot into a user account. Telegram's type system marks every TL method as `bot` or `user`. Calling a user-only method from a bot session returns `BOT_METHOD_INVALID`.

---

## The method matrix

| Capability | HTTP Bot API | Bot over MTProto | User over MTProto | Evidence |
|---|---|---|---|---|
| Authenticate bot via MTProto | Not applicable | `auth.importBotAuthorization` | Not applicable | Current production code |
| Resolve exact public username | Partial (chat usernames in some endpoints) | `contacts.resolveUsername` | Yes | Official docs + code |
| Enumerate participants | No general endpoint | `channels.getParticipants` (admin access may be required) | Yes | Current production probe |
| Expanded user profile | No `getFullUser` equivalent | `users.getFullUser` with valid `access_hash` | Yes | Current production code |
| Expanded channel profile | `getChat` (bot-oriented view) | `channels.getFullChannel` | Yes | Official docs |
| Fetch known message by ID | No general `getMessage` endpoint | `messages.getMessages` / `channels.getMessages` | Yes | Production probe verified |
| Bot-visible update sync | `getUpdates`, webhooks | `updates.getState`, `updates.getDifference` | Yes | Official docs + earlier POC |
| Unrestricted history | Not available | **Not available** | `messages.getHistory` | Official flag: user-only |
| Dialog list | Not available | **Not available** | `messages.getDialogs` | Official flag: user-only |
| Server-side message search | Not available | **Not available** | `messages.search` | Official flag: user-only |
| Contact search / phone resolve | Not available | **Not available** | `contacts.search`, `contacts.resolvePhone` | Official flag: user-only |

**Evidence label key:** "Current production code" means the method is called by a live bot MTProto session. "Production probe" means a live session exercised the method and confirmed no error. "Official docs" means Telegram's core.telegram.org marks it bot-callable. "Earlier POC" means the method worked in a controlled experiment.

---

## What opens up through bot-token MTProto

### 1. Resolve an exact public username

`contacts.resolveUsername` is officially bot-callable. It returns a `ResolvedPeer` with the peer's `access_hash`, type, and additional peer information.

```python
from telethon import functions

result = await client(
    functions.contacts.ResolveUsernameRequest("some_public_username")
)
# result.peer, result.chats, result.users
```

This is exact resolution only, with no substring search. The HTTP Bot API has no equivalent that returns a peer with an MTProto access hash.

### 2. Enumerate participants where the bot has access

`channels.getParticipants` is officially bot-callable. In practice, Telegram may return `CHAT_ADMIN_REQUIRED` depending on the channel's privacy settings and the bot's admin rights.

```python
users = await client.get_participants(channel, search="", limit=100)
```

Telethon maps `get_participants` to `channels.getParticipants` for channels. Each returned user carries a session-scoped `access_hash`.

**Limits:** This is not a tool for enumerating arbitrary broadcast-channel subscribers. The bot must have legitimate access (typically as an admin), and Telegram enforces rate limits with `FLOOD_WAIT`.

### 3. Enrich known users with FullUser

`users.getFullUser` is officially bot-callable when you provide a valid `InputUser` containing both `user_id` and the `access_hash` observed by the same MTProto session.

```python
from telethon import functions, types

user = types.InputUser(user_id=user_id, access_hash=access_hash)
full = await client(functions.users.GetFullUserRequest(user))
```

The HTTP Bot API has `getChatMember`, but no method that returns the expanded `UserFull` object available through MTProto, including the user's about text and other extended fields.

This is the pipeline that matters for practical use:

```
channels.getParticipants
        ↓
user_id + access_hash
        ↓
users.getFullUser
```

The hash is scoped to the bot session that obtained it. Reusing an `access_hash` from a different session or account will fail.

### 4. Fetch a known message by ID

`messages.getHistory` is user-only. But **if you already know a message ID**, `messages.getMessages` and `channels.getMessages` are bot-callable.

Telethon exposes a convenient helper:

```python
message = await client.get_messages(peer, ids=message_id)
```

Under the hood, Telethon routes the request based on the peer type:

- **Channel or supergroup** → `channels.getMessages`
- **Other applicable peer types** → `messages.getMessages`

You can also call the raw method explicitly:

```python
from telethon import functions, types

result = await client(
    functions.channels.GetMessagesRequest(
        channel=channel,
        id=[types.InputMessageID(id=message_id)],
    )
)
```

There is no TL method called `getMessageById`. That name exists in library helpers and blog posts, but not in Telegram's type language.

> **Important:** `client.iter_messages(peer)` and `client.get_messages(peer)` without `ids=` do not use this bot-callable path. Telethon routes them to `messages.getHistory` or `messages.search`, which are user-only. For a bot session, explicit IDs are the difference between a valid request and `BOT_METHOD_INVALID`.

### 5. Backfill a bounded ID range

Because `messages.getMessages` and `channels.getMessages` accept lists of IDs, you can backfill a known bounded range in a channel or supergroup. Do not use this pattern for basic groups or private chats, where IDs do not form a per-peer sequence:

```python
import asyncio
from telethon.errors import FloodWaitError

async def fetch_known_range(client, channel, first_id, last_id, batch_size=100):
    """For channels and supergroups with a known bounded ID range."""
    cursor = first_id

    while cursor <= last_id:
        ids = list(range(cursor, min(cursor + batch_size, last_id + 1)))

        try:
            messages = await client.get_messages(channel, ids=ids)
        except FloodWaitError as error:
            await asyncio.sleep(error.seconds)
            continue

        for message in messages:
            if message is not None:
                yield message

        cursor += batch_size
        await asyncio.sleep(0.25)
```

**This is not `getHistory` under another name.** Four limits apply:

1. You need a **known anchor** or bounded ID range. You cannot discover the latest ID without an update or a known reference point.
2. IDs are not guaranteed to form a gap-free archive. Deleted posts, inaccessible messages, and `MessageEmpty` results create holes.
3. The bot can only retrieve messages Telegram considers visible to that bot.
4. Large scans need persistence, deduplication, pacing, and `FLOOD_WAIT` handling.

For a durable inbox, `updates.getDifference` is usually the better starting point. It recovers bot-visible updates and peers after login without pretending to be unrestricted history.

### 6. Recover bot-visible update state

`updates.getState` and `updates.getDifference` are officially bot-callable. They let a bot session recover the update stream it would have received through normal MTProto updates, bounded by the usual constraints.

---

## Methods that stay blocked

These methods are user-only in Telegram's current documentation. A bot session calling them will receive `BOT_METHOD_INVALID`.

| Method | What it would provide | Bot-token result |
|---|---|---|
| `messages.getHistory` | Dialog history | Blocked |
| `messages.getDialogs` | List of dialogs | Blocked |
| `messages.getPeerDialogs` | Individual dialog state | Blocked |
| `messages.search` | Server-side message search | Blocked |
| `contacts.search` | Substring search over contacts and public peers | Blocked |
| `contacts.resolvePhone` | Resolve a phone number | Blocked |
| `bots.getBotRecommendations` | Telegram's similar-bot suggestions | Blocked (despite its namespace) |

Bot policy also still applies. A bot cannot:
- Initiate arbitrary private chats with users who have not interacted with it
- Bypass group or channel privacy settings
- Enumerate every subscriber of a broadcast channel
- Reuse an `access_hash` from an unrelated account or MTProto session

---

## Where bot-token MTProto is useful

The usable surface is narrower than a user account, but it opens real engineering use cases:

| Use case | What it replaces | Risk reduction |
|---|---|---|
| Member discovery in chats the bot can access | A user account reading `getParticipants` | No SIM card or automated personal account |
| Richer profiles for observed users | A user account calling `getFullUser` per profile | Same bot identity, session-scoped hashes |
| Exact public username resolution | User-level MTProto session or separate resolver | No separate authentication needed |
| Message re-fetch over bounded ID ranges | Full history access | Only messages the bot can already see |
| Bot-visible update recovery | A second Bot API update loop | Stateful native update recovery |

For these jobs, a bot MTProto session can remove the need for a farm of user accounts and SIM cards, along with the operational risk that comes with automating personal Telegram accounts.

---

## Related Telegram automation

The method boundary matters most when choosing an account model. My guide to [getting a Telegram channel subscribers list in Python](/how-to-get-a-telegram-channel-subscribers-list-in-python/) covers the user-session route. [Watching Telegram Stories from Python](/how-to-watch-telegram-stories-from-python/) is another example of a feature that needs user-level MTProto. More practical notes live in the [Telegram automation topic](/topics/telegram-automation/), with broader operator notes in the [English blog](/en/blog/).

---

## Decision guide

| Your goal | What to use |
|---|---|
| Build a regular chat bot (send messages, keyboards, payments) | **HTTP Bot API**: simpler, well-documented, webhooks |
| Enumerate members in a channel you admin, enrich user profiles, resolve usernames | **Bot-token MTProto**: you need `auth.importBotAuthorization` + Telethon |
| Read unrestricted history, search messages, list all dialogs | **Bot over MTProto blocked**: you need a user MTProto session |
| Backfill specific message IDs or ranges | **Bot-token MTProto**: `channels.getMessages` / `messages.getMessages` with known IDs |
| Maintain state in a native MTProto update loop | **Bot-token MTProto**: `updates.getDifference` works for bot-visible events |

Bot-token MTProto gives you a small, useful subset of Telegram's native API. It is enough for participant discovery, profile enrichment, exact username resolution, and message re-fetch by ID. It is not a hidden user mode.

---

## Frequently asked questions

### Can a Telegram bot use MTProto?

Yes. A bot can authorize an MTProto session through `auth.importBotAuthorization` using a BotFather token plus a Telegram `api_id` and `api_hash`. The session still has bot permissions, so user-only methods remain blocked.

### Can a bot read Telegram chat history through MTProto?

No. `messages.getHistory` is user-only. A bot can fetch specific visible messages when it already knows their IDs, using `messages.getMessages` or `channels.getMessages`, but it cannot paginate unrestricted history.

### Can a bot list channel or group members?

A bot can call `channels.getParticipants` for channels and supergroups it can legitimately access. Telegram may require admin rights, and broadcast-channel subscriber lists remain restricted.

### Is there a Telegram MTProto method called getMessageById?

No. The underlying methods are `messages.getMessages` and `channels.getMessages`. Telethon exposes `client.get_messages(peer, ids=...)` as a helper and chooses the correct method for the peer type.

### Does a Telegram access_hash work across accounts?

No. Treat each `access_hash` as session-contextual. Store it with the bot or user session that observed it and do not reuse it from an unrelated account.

---

## Sources

- [Telegram MTProto bots](https://core.telegram.org/api/bots)
- [`auth.importBotAuthorization`](https://core.telegram.org/method/auth.importBotAuthorization)
- [`contacts.resolveUsername`](https://core.telegram.org/method/contacts.resolveUsername)
- [`channels.getParticipants`](https://core.telegram.org/method/channels.getParticipants)
- [`users.getFullUser`](https://core.telegram.org/method/users.getFullUser)
- [`channels.getFullChannel`](https://core.telegram.org/method/channels.getFullChannel)
- [`messages.getMessages`](https://core.telegram.org/method/messages.getMessages)
- [`channels.getMessages`](https://core.telegram.org/method/channels.getMessages)
- [`updates.getState`](https://core.telegram.org/method/updates.getState)
- [`updates.getDifference`](https://core.telegram.org/method/updates.getDifference)
- [Telethon](https://github.com/LonamiWebs/Telethon)
