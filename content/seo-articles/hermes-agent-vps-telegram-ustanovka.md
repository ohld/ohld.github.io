---
title: Hermes Agent на VPS с Telegram: установка и проверка по шагам
description: Как установить Hermes Agent на VPS, подключить модель и Telegram, запустить gateway как сервис и проверить весь путь от сообщения до ответа.
publishedAt: 2026-08-11
updatedAt: 2026-08-11
readingTime: 14 мин
lang: ru
slug: hermes-agent-vps-telegram-ustanovka
tags: Hermes Agent, AI-агенты, Telegram, VPS
primaryKeyword: установка Hermes Agent
secondaryKeywords: Hermes Agent VPS; настройка Hermes Agent; Hermes Agent Telegram
searchIntent: Инструкция
cluster: hermes-agent
coverImage: /assets/articles/hermes-agent-vps-telegram-ustanovka/hermes-vps-telegram-cover-20260811.webp
coverAlt: Мем — HERMES ставить ты вправе, но по шагам проверять обязан
---

Hermes Agent можно поставить одной командой. Сложность начинается после слова «установлено»: модель не отвечает, Telegram молчит, а процесс умирает после выхода из SSH.

Поэтому ниже не обзор возможностей, а рабочая последовательность с проверкой каждого слоя:

`VPS → Hermes → модель → Telegram → фоновый сервис → сообщение с телефона`.

Я использую Hermes как постоянного ассистента в Telegram и отдельно перепроверил чистую установку для этой инструкции. 11 августа 2026 года официальный установщик поставил **Hermes Agent v0.20.0** в изолированный каталог на Debian 13. Команды gateway также проверены на работающем сервере.

> **Что стоит сохранить:** в конце есть короткий чеклист готовности и таблица диагностики. По ним удобно перепроверять сервер после обновлений.

## Что получится

После инструкции у вас будет:

- Hermes Agent на обычном Linux VPS;
- выбранная модель через OAuth или API-провайдера;
- приватный Telegram-бот, который отвечает только разрешённым пользователям;
- gateway под `systemd`, переживающий выход из SSH и перезагрузку;
- понятная последовательность диагностики, если бот замолчал.

Для первого запуска не нужны Docker, Kubernetes, публичный порт или домен. Стандартный Telegram gateway использует исходящие запросы к Telegram через long polling.

## Что подготовить

1. **VPS с Linux.** Ubuntu 22.04/24.04 или Debian 12/13 подойдут. В официальном гайде Nous Research указано, что для gateway достаточно VPS примерно за $5 в месяц: сама модель работает у внешнего провайдера.
2. **Обычного пользователя с `sudo`.** Не запускайте персонального агента постоянно от `root`.
3. **Telegram-аккаунт.** Он понадобится для создания бота и получения вашего числового user ID.
4. **Доступ к модели.** Самый простой вариант — Nous Portal. Также Hermes поддерживает OpenAI Codex через авторизацию ChatGPT и API-провайдеров вроде OpenRouter.

Если вы вошли на новый сервер как `root`, создайте отдельного пользователя:

```bash
adduser hermes
usermod -aG sudo hermes
su - hermes
```

Дальше все команды выполняются от него.

## Шаг 1. Установить Hermes Agent

Поставьте базовые пакеты:

```bash
sudo apt update
sudo apt install -y curl git ca-certificates
```

Официальная короткая команда установки:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

Если не любите передавать скачанный скрипт сразу в shell, сначала сохраните и просмотрите его:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh \
  -o /tmp/hermes-install.sh
less /tmp/hermes-install.sh
bash /tmp/hermes-install.sh
```

Установщик сам подбирает Python 3.11, создаёт отдельное виртуальное окружение, ставит зависимости и добавляет команду `hermes` в `~/.local/bin`.

Перезагрузите shell и проверьте версию:

```bash
exec "$SHELL" -l
hermes --version
```

Если получили `hermes: command not found`, не запускайте установщик второй раз. Сначала выполните:

```bash
export PATH="$HOME/.local/bin:$PATH"
hermes --version
```

А затем добавьте эту строку в `~/.bashrc`, если установщик ещё не сделал этого.

## Шаг 2. Сначала заставить работать модель

Не подключайте Telegram, пока Hermes не отвечает в терминале. Иначе придётся одновременно разбираться с моделью, токеном бота и gateway.

Для самого короткого пути через Nous Portal:

```bash
hermes setup --portal
```

Команда откроет OAuth-авторизацию, предложит модель и подключит Nous Tool Gateway. API-ключ копировать не нужно.

Если хотите использовать ChatGPT/Codex или свой API-провайдер, запустите общий мастер:

```bash
hermes setup
```

Либо сразу откройте выбор модели:

```bash
hermes model
```

В текущем Quickstart для модели указан контекст не меньше 64K токенов. Это требование может меняться между версиями, поэтому перепроверьте его при выборе провайдера.

После настройки сделайте настоящий запрос:

```bash
hermes chat -q "Ответь одной строкой: модель работает"
```

Ожидаемый результат — осмысленный текстовый ответ без ошибки авторизации. Дополнительно проверьте конфигурацию:

```bash
hermes config check
hermes doctor
```

Предупреждения о ещё не подключённых инструментах допустимы. Блокирующая проблема на этом этапе — отсутствие рабочего провайдера или модели.

## Шаг 3. Создать Telegram-бота

Откройте в Telegram официальный бот [@BotFather](https://t.me/BotFather):

1. отправьте `/newbot`;
2. задайте отображаемое имя;
3. придумайте username, заканчивающийся на `bot`;
4. сохраните выданный токен.

Токен выглядит как `123456789:AA...`. Это пароль от бота. Не отправляйте его в чаты, не коммитьте в Git и не вставляйте в скриншоты.

Если токен утёк, сразу отзовите его через `/revoke` в @BotFather и повторите настройку gateway с новым токеном.

Теперь получите **числовой ID своего Telegram-аккаунта**. Проще всего написать [@userinfobot](https://t.me/userinfobot). Нужен ID человека, а не username вида `@name` и не число до двоеточия в токене бота.

## Шаг 4. Подключить Telegram к Hermes

Запустите мастер gateway:

```bash
hermes gateway setup
```

В актуальной версии он предлагает два пути:

- **Automatic** — создание через QR-код;
- **Manual** — BotFather и ручная вставка токена.

Для воспроизводимой настройки выберите `Telegram → Manual`, затем вставьте:

- bot token от BotFather;
- ваш числовой Telegram user ID в список разрешённых пользователей.

Мастер сохраняет секреты локально в Hermes home. Эквивалентная ручная конфигурация выглядит так:

```dotenv
# ~/.hermes/.env
TELEGRAM_BOT_TOKEN=[REDACTED]
TELEGRAM_ALLOWED_USERS=123456789
```

Не включайте доступ всем пользователям ради быстрого теста. Начните с одного личного ID: так вы одновременно проверите токен, allowlist и активный профиль.

`TELEGRAM_ALLOWED_USERS` ограничивает круг собеседников, но не урезает права уже разрешённого пользователя. Telegram-профиль Hermes может иметь доступ к terminal и файловым инструментам. Если бот будет не только вашим, сначала выделите отдельный профиль и ограничьте его инструменты через `hermes tools`.

## Шаг 5. Проверить gateway в foreground

Сначала запустите gateway прямо в SSH-сессии:

```bash
hermes gateway run
```

Откройте созданного бота в Telegram и отправьте:

```text
Ответь одной строкой: Telegram работает
```

Если появился осмысленный ответ, весь путь уже работает:

`Telegram → gateway → Hermes → модель → gateway → Telegram`.

Остановите foreground-процесс через `Ctrl+C`. Только после этого переходите к фоновому сервису. Один Telegram bot token нельзя одновременно использовать в двух gateway: Telegram отклонит конкурирующий long polling.

## Шаг 6. Запустить Hermes постоянно

Самый простой вариант без системной установки — пользовательский сервис `systemd` плюс linger:

```bash
hermes gateway install --start-now
sudo loginctl enable-linger "$USER"
hermes gateway status --deep
```

`linger` разрешает пользовательскому сервису работать после выхода из SSH и подниматься при загрузке сервера.

Проверьте оба условия:

```bash
systemctl --user is-enabled hermes-gateway
loginctl show-user "$USER" -p Linger
```

Ожидаемо: сервис `enabled`, а `Linger=yes`.

Если вы предпочитаете системный сервис на headless VPS, официальный CLI поддерживает отдельный режим:

```bash
sudo hermes gateway install --system --run-as-user "$USER" --start-now
sudo hermes gateway status --deep --system
```

Не устанавливайте одновременно пользовательский и системный gateway с одним токеном.

## Шаг 7. Сделать проверку после перезагрузки

Это обязательная часть. Работающий foreground-процесс ещё не означает, что бот переживёт reboot.

```bash
sudo reboot
```

После возвращения сервера:

```bash
hermes gateway status --deep
```

И снова отправьте Telegram-боту короткое сообщение. Статус процесса без реального ответа из Telegram — только половина проверки.

## Короткий чеклист готовности

Сохраните этот блок. После установки или обновления проходите сверху вниз:

```bash
# 1. CLI установлен
hermes --version

# 2. Конфигурация читается
hermes config check

# 3. Модель отвечает без Telegram
hermes chat -q "Ответь одним словом: ready"

# 4. Gateway запущен
hermes gateway status --deep

# 5. Сервис переживёт logout/reboot
systemctl --user is-enabled hermes-gateway
loginctl show-user "$USER" -p Linger

# 6. Финальная проверка
# Отправить личное сообщение боту и получить осмысленный ответ
```

## Если Telegram-бот молчит

Не меняйте всё сразу. Найдите первый слой, который не проходит проверку.

| Симптом | Что проверить | Что делать |
|---|---|---|
| `hermes: command not found` | Есть ли `~/.local/bin` в `PATH` | `export PATH="$HOME/.local/bin:$PATH"`, затем перезапустить shell |
| Hermes не отвечает даже в CLI | Провайдер и модель | `hermes model`, потом снова `hermes chat -q ...` |
| CLI отвечает, бот молчит | Gateway, bot token, allowlist | `hermes gateway status --deep`; повторить `hermes gateway setup` |
| Бот пишет `unauthorized` или игнорирует вас | В allowlist попал username или ID бота | Указать числовой ID вашего человеческого аккаунта |
| В логах конфликт polling/getUpdates | Один token используют два процесса | Остановить дубликат; один токен — один работающий gateway |
| Foreground работает, после SSH logout — нет | Сервис не установлен или выключен linger | `hermes gateway install --start-now` и `sudo loginctl enable-linger "$USER"` |
| После обновления конфигурация устарела | Версия схемы config | `hermes config check`, `hermes config migrate`, `hermes doctor` |
| Сервис запущен, но ответы падают | Ошибка модели или лимиты провайдера | Сначала повторить CLI-запрос, затем проверить провайдера и fallback |

Логи пользовательского сервиса:

```bash
journalctl --user -u hermes-gateway -n 100 --no-pager
journalctl --user -u hermes-gateway -f
```

Для системного сервиса уберите `--user`:

```bash
sudo journalctl -u hermes-gateway -n 100 --no-pager
```

## Минимальная безопасная конфигурация

Для личного бота я бы оставил такие ограничения:

- один отдельный Linux-пользователь;
- один bot token на один gateway;
- явный `TELEGRAM_ALLOWED_USERS`;
- сначала только личные сообщения;
- секреты только в локальном `.env` или secret manager;
- доступ на VPS по SSH-ключу;
- реальная проверка Telegram после каждого обновления.

Не добавляйте бота в рабочие группы, пока личный DM-сценарий не стабилен. В группе появляются дополнительные правила: privacy mode, разрешённые чаты, упоминания, темы и риск показать инструменты лишним людям.

## Как обновлять без сюрпризов

```bash
hermes update
hermes config check
hermes doctor
hermes gateway restart
hermes gateway status --deep
```

После этого отправьте боту личное сообщение. Не считайте обновление завершённым только потому, что команда вернула exit code 0.

## Сколько это стоит

Сам Hermes — open source. Практические расходы состоят из двух частей:

- VPS: официальный гайд ориентируется примерно на $5 в месяц для лёгкого gateway;
- модель: подписка или API-расходы у выбранного провайдера.

Покупать отдельный Mac mini ради первого теста не требуется. Но и «бесплатным ChatGPT в Telegram» это не становится: качество, лимиты и стоимость зависят от выбранного маршрута к модели.

## Что дальше

После стабильного личного бота можно переходить к [сравнению Hermes Agent и OpenClaw](/ru/articles/hermes-agent-vs-openclaw/) и решать, нужен ли вам именно Hermes как постоянный рабочий агент.

## Источники

- [Hermes Agent Quickstart](https://hermes-agent.nousresearch.com/docs/getting-started/quickstart)
- [Hermes Agent Installation](https://hermes-agent.nousresearch.com/docs/getting-started/installation)
- [Официальная документация Telegram gateway](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)
- [Messaging Gateway и systemd](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/)
- [Team Telegram Assistant](https://hermes-agent.nousresearch.com/docs/guides/team-telegram-assistant)
- [Мой исходный разбор Hermes Agent на Хабре](https://habr.com/ru/articles/1053846/)
