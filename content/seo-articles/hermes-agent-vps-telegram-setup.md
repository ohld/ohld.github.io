---
title: Hermes Agent on a VPS with Telegram: verified setup guide
description: Install Hermes Agent on a Linux VPS, connect a model and Telegram, run the gateway under systemd, and verify the complete message path.
publishedAt: 2026-08-11
updatedAt: 2026-08-11
readingTime: 13 min
lang: en
slug: hermes-agent-vps-telegram-setup
tags: Hermes Agent, AI agents, Telegram, VPS
primaryKeyword: Hermes Agent VPS setup
secondaryKeywords: install Hermes Agent; Hermes Agent Telegram setup; self-host Hermes Agent
searchIntent: Instructional
cluster: hermes-agent
coverImage: /assets/articles/hermes-agent-vps-telegram-setup/hermes-vps-telegram-cover-20260811.webp
coverAlt: Meme — install Hermes as you please, but verify every layer
---

Installing Hermes Agent is the easy part. The useful milestone is different: you send a message from your phone, the right model answers, and the bot still works after you close SSH and reboot the server.

This is a failure-aware runbook for that complete path:

`VPS → Hermes → model provider → Telegram → background service → phone`.

I use Hermes as an always-on assistant in Telegram. For this guide, I also repeated the installer flow in an isolated directory on Debian 13. On August 11, 2026, the official installer produced **Hermes Agent v0.20.0**. I separately checked the gateway commands against a live server.

> **Save this page for later:** the final readiness checklist and troubleshooting table are designed for both the first install and future upgrades.

## The result

By the end, you will have:

- Hermes Agent installed on a regular Linux VPS;
- a working model through OAuth or an API provider;
- a private Telegram bot restricted to approved numeric user IDs;
- a `systemd` gateway that survives logout and reboot;
- a layer-by-layer test sequence for silent-bot failures.

You do not need Docker, Kubernetes, a public port, or a domain for the basic setup. The default Telegram gateway uses outbound long polling.

## What you need

1. **A Linux VPS.** Ubuntu 22.04/24.04 or Debian 12/13 are sensible choices. The official Nous Research team guide says a roughly $5/month VPS is enough for the gateway because model inference happens remotely.
2. **A non-root user with `sudo`.** Do not run a personal agent permanently as `root`.
3. **A Telegram account.** You need it to create the bot and get your numeric user ID.
4. **A model route.** The fastest option is Nous Portal. Hermes also supports OpenAI Codex through ChatGPT authentication and API providers such as OpenRouter.

If your VPS provider drops you into a root shell, create a dedicated user first:

```bash
adduser hermes
usermod -aG sudo hermes
su - hermes
```

Run the remaining commands as that user.

## 1. Install Hermes Agent

Install the small set of base packages:

```bash
sudo apt update
sudo apt install -y curl git ca-certificates
```

The official one-line installer is:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

If piping a remote script directly into a shell makes you uncomfortable, download and inspect it first:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh \
  -o /tmp/hermes-install.sh
less /tmp/hermes-install.sh
bash /tmp/hermes-install.sh
```

The installer selects Python 3.11, creates an isolated virtual environment, installs Hermes and its dependencies, and places the CLI launcher in `~/.local/bin`.

Reload your shell and confirm the executable:

```bash
exec "$SHELL" -l
hermes --version
```

If the shell says `hermes: command not found`, do not reinstall immediately. Test the expected binary path first:

```bash
export PATH="$HOME/.local/bin:$PATH"
hermes --version
```

Persist that export in `~/.bashrc` if the installer did not add it.

## 2. Prove the model works before adding Telegram

This is the most important sequencing decision in the guide. If the CLI cannot complete one normal request, a Telegram gateway only adds another place to look for the same failure.

For the shortest path through Nous Portal:

```bash
hermes setup --portal
```

This opens an OAuth flow, lets you select a model, and enables the Nous Tool Gateway without copying an API key.

For ChatGPT/Codex or another provider, run the full setup wizard:

```bash
hermes setup
```

Or open the provider and model picker directly:

```bash
hermes model
```

The current Quickstart specifies a minimum 64K-token context window. That requirement can change between releases, so verify it when selecting a provider and model.

Now run a real non-interactive request:

```bash
hermes chat -q "Reply with one line: the model works"
```

The pass condition is a meaningful text response with no authentication error. Then inspect the local configuration:

```bash
hermes config check
hermes doctor
```

Warnings about optional tools you have not configured are normal. A missing working model is not.

## 3. Create the Telegram bot

Open Telegram's official [@BotFather](https://t.me/BotFather) bot:

1. send `/newbot`;
2. choose a display name;
3. choose a username ending in `bot`;
4. save the token BotFather returns.

A bot token looks like `123456789:AA...`. Treat it as a password. Do not paste it into a chat, commit it to Git, or leave it visible in screenshots.

If the token leaks, revoke it immediately with `/revoke` in @BotFather, then repeat the gateway setup with the replacement token.

Next, get the **numeric ID of your human Telegram account**. Messaging [@userinfobot](https://t.me/userinfobot) is the simplest route. Do not use your `@username`, and do not use the numeric prefix from the bot token.

## 4. Connect Telegram to Hermes

Run the messaging setup wizard:

```bash
hermes gateway setup
```

The current wizard offers two Telegram paths:

- **Automatic** — create the bot through a QR-code flow;
- **Manual** — create it with BotFather and paste the token yourself.

For an auditable setup, choose `Telegram → Manual`, then enter:

- the BotFather token;
- your human numeric Telegram ID in the allowed-users list.

The equivalent manual environment file looks like this:

```dotenv
# ~/.hermes/.env
TELEGRAM_BOT_TOKEN=[REDACTED]
TELEGRAM_ALLOWED_USERS=123456789
```

Do not enable global access just to get through the first test. Starting with one explicit ID proves that the token, allowlist, and active Hermes home all match.

`TELEGRAM_ALLOWED_USERS` restricts who can talk to the bot; it does not reduce the tools available to an approved user. A Telegram Hermes profile may include terminal and file access. If anyone else will use the bot, isolate it in a separate profile and restrict its tools through `hermes tools` first.

## 5. Test the gateway in the foreground

Run:

```bash
hermes gateway run
```

Open your bot in Telegram and send:

```text
Reply with one line: Telegram works
```

A meaningful response proves the whole round trip:

`Telegram → gateway → Hermes → model → gateway → Telegram`.

Stop the foreground process with `Ctrl+C` before installing a service. Telegram rejects concurrent polling when two gateway processes reuse the same bot token.

## 6. Keep the gateway running after SSH logout

A user-level `systemd` service plus lingering is the least surprising setup for a dedicated non-root account:

```bash
hermes gateway install --start-now
sudo loginctl enable-linger "$USER"
hermes gateway status --deep
```

Lingering lets the user's service continue after logout and start during boot.

Verify both parts explicitly:

```bash
systemctl --user is-enabled hermes-gateway
loginctl show-user "$USER" -p Linger
```

You want `enabled` and `Linger=yes`.

For a headless VPS, the CLI also supports a system-level service:

```bash
sudo hermes gateway install --system --run-as-user "$USER" --start-now
sudo hermes gateway status --deep --system
```

Choose one service mode. Do not run both modes with the same Telegram token.

## 7. Reboot and test from the phone again

A process that worked in an SSH terminal has not yet passed the deployment test.

```bash
sudo reboot
```

After the server returns:

```bash
hermes gateway status --deep
```

Then send another real Telegram message. A green process status without an end-to-end reply is only half a verification.

## Copyable readiness checklist

Run this after the first setup and after every upgrade:

```bash
# 1. CLI exists
hermes --version

# 2. Configuration is readable
hermes config check

# 3. The model works without Telegram
hermes chat -q "Reply with one word: ready"

# 4. The gateway is healthy
hermes gateway status --deep

# 5. The user service survives logout and reboot
systemctl --user is-enabled hermes-gateway
loginctl show-user "$USER" -p Linger

# 6. Final check
# Send the bot a private message and receive a meaningful answer
```

## Troubleshooting a silent bot

Change one layer at a time. Find the first failed check instead of resetting the whole installation.

| Symptom | Check | Fix |
|---|---|---|
| `hermes: command not found` | Is `~/.local/bin` in `PATH`? | Export the path and restart the shell |
| Hermes fails in the CLI | Provider and model auth | Run `hermes model`, then repeat the one-shot CLI request |
| CLI works, Telegram is silent | Gateway status, token, allowlist | Run `hermes gateway status --deep`; repeat `hermes gateway setup` |
| The bot ignores you or reports unauthorized | Human ID vs username/bot ID | Put your numeric human account ID in the allowlist |
| Logs show polling/getUpdates conflicts | Duplicate process using one token | Stop the duplicate; one token should have one active gateway |
| Foreground works, logout breaks it | Service or lingering is missing | Reinstall the user service and enable linger |
| Config becomes outdated after an upgrade | Config schema version | Run `hermes config check`, `hermes config migrate`, and `hermes doctor` |
| Gateway is up but model calls fail | Provider limits or auth | Reproduce in the CLI first, then repair the provider or fallback route |

User-service logs:

```bash
journalctl --user -u hermes-gateway -n 100 --no-pager
journalctl --user -u hermes-gateway -f
```

For a system service:

```bash
sudo journalctl -u hermes-gateway -n 100 --no-pager
```

## The minimum safe shape

For a personal Telegram agent, I would keep these boundaries:

- one dedicated Linux user;
- one bot token per gateway;
- an explicit `TELEGRAM_ALLOWED_USERS` list;
- private messages first, groups later;
- secrets only in the local environment file or a secret manager;
- SSH key access to the VPS;
- a real Telegram test after every update.

Do not add the bot to a work group until the private DM path is stable. Groups add privacy mode, allowed chats, mention rules, topics, and a much larger permission surface.

## Updating without guessing

```bash
hermes update
hermes config check
hermes doctor
hermes gateway restart
hermes gateway status --deep
```

Finish by sending a private message to the bot. An exit code of zero from the update command is not an end-to-end deployment check.

## Cost

Hermes itself is open source. The recurring cost has two parts:

- the VPS: the official guide uses roughly $5/month as a reasonable gateway baseline;
- the model: a subscription or API usage from your chosen provider.

You do not need to buy a Mac mini for this first deployment. You also are not creating “free ChatGPT in Telegram”: model quality, limits, and cost still come from the provider route you choose.

## Where to go next

Once the DM bot survives a reboot, the useful next question is architecture rather than installation. My [always-on AI agent server setup](/always-on-ai-agent-server-setup/) explains that wider choice.

## Sources

- [Hermes Agent Quickstart](https://hermes-agent.nousresearch.com/docs/getting-started/quickstart)
- [Hermes Agent Installation](https://hermes-agent.nousresearch.com/docs/getting-started/installation)
- [Official Telegram gateway documentation](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)
- [Messaging Gateway and systemd](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/)
- [Team Telegram Assistant tutorial](https://hermes-agent.nousresearch.com/docs/guides/team-telegram-assistant)
- [My original Hermes Agent article on Habr](https://habr.com/ru/articles/1053846/)
