import { useEffect, useState } from 'react'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'
import './BotRevolutionDraft.css'

const PROMPT = 'Based on what you know about me, how would you set up GrokBot? Which bots should we set up?'

const timeline = [
  ['2023', 'ChatGPT', 'AI лучше гуглит'],
  ['2024', 'Cursor', 'AI помогает прогать'],
  ['2025', 'Claude Code', 'AI лучше прогает'],
  ['2026', 'OpenClaw', 'AI интегрируется с сервисами'],
  ['2026.5', 'The Bot Revolution', 'AI становится командой'],
]

function ExternalLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}<span aria-hidden="true">↗</span>
    </a>
  )
}

function CommunityMessage({
  href,
  avatar,
  author,
  username,
  children,
}: {
  href: string
  avatar: string
  author: string
  username: string
  children: React.ReactNode
}) {
  return (
    <article className="bot-revolution-community-message">
      <img src={avatar} alt={author} width="256" height="256" loading="lazy" />
      <div>
        <div className="bot-revolution-community-author">
          <strong>{author}</strong>
          <a href={href} target="_blank" rel="noopener noreferrer">@{username}</a>
        </div>
        <p>{children}</p>
      </div>
    </article>
  )
}

export function BotRevolutionDraft() {
  const [copied, setCopied] = useState(false)

  useDocumentMeta({
    title: 'The Bot Revolution — Даниил Охлопков',
    description: 'Следующая ступень AI-инструментов: один Главный, постоянная память и команда специализированных ботов.',
    canonical: absoluteUrl('/drafts/bot-revolution/'),
    robots: 'noindex, nofollow',
    image: absoluteUrl('/assets/drafts/bot-revolution/bot-weather-map.webp'),
    imageAlt: 'The Bot Revolution: карта с командой AI-ботов',
    type: 'article',
    section: 'AI Agents',
    tags: ['AI Agents', 'Grok Bot', 'Hermes Bot', 'Telegram'],
  })

  useEffect(() => {
    document.body.classList.add('bot-revolution-body')
    return () => document.body.classList.remove('bot-revolution-body')
  }, [])

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(PROMPT)
    } catch {
      const field = document.createElement('textarea')
      field.value = PROMPT
      field.style.position = 'fixed'
      field.style.opacity = '0'
      document.body.appendChild(field)
      field.select()
      document.execCommand('copy')
      field.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="bot-revolution-page">
      <section className="bot-revolution-hero">
        <div className="bot-revolution-hero-copy">
          <p className="bot-revolution-kicker">Август 2026</p>
          <h1>The Bot<br /> Revolution</h1>
          <p className="bot-revolution-lead">
            Кажется, следующая ступень AI-инструментов уже началась.<br className="bot-revolution-mobile-break" /> AI перестаёт быть одной дорогой сессией и превращается в команду.
          </p>
        </div>

        <figure className="bot-revolution-art bot-revolution-hero-art">
          <img
            src="/assets/drafts/bot-revolution/bot-weather-map.webp"
            alt="The Bot Revolution — ведущая показывает карту с распределёнными AI-ботами"
            width="2048"
            height="2048"
            fetchPriority="high"
          />
        </figure>
      </section>

      <section className="bot-revolution-timeline" id="timeline" aria-label="Таймлайн AI-инструментов">
        {timeline.map(([year, tool, take], index) => (
          <article className={index === timeline.length - 1 ? 'is-next' : undefined} key={year}>
            <span className="bot-revolution-year">{year}</span>
            <strong>{tool}</strong>
            <p>{take}</p>
          </article>
        ))}
      </section>

      <section className="bot-revolution-chapter">
        <figure className="bot-revolution-art">
          <img
            src="/assets/drafts/bot-revolution/ai-becomes-team.webp"
            alt="AI превращается в команду — сюрреалистичный коллаж"
            width="2048"
            height="2048"
            loading="lazy"
          />
        </figure>

        <div className="bot-revolution-copy">
          <h2>Всё не засунуть<br />в одну сессию</h2>
          <p>
            Опытные AI-разработчики уже поняли:<br />
            всю инфу всех проектов не засунуть в один контекст.<br />
            А так хочется иметь <code>single point of contact</code>:<br />
            писать Chief of Staff, чтобы он прочитал нужное и порешал сам.
          </p>
          <p>
            <ExternalLink href="https://t.me/ohld_chat/45534">Grok Bot</ExternalLink>,{' '}
            <ExternalLink href="https://t.me/ohld_chat/45546">Hermes Bot</ExternalLink> и{' '}
            <ExternalLink href="https://t.me/danokhlopkov/1731">Berd</ExternalLink> почти синхронно релизнули новый формат общения с агентами: чат, сотрудники, каналы, лупы.
          </p>

          <div className="bot-revolution-loop" aria-label="Пример agent loop">
            <span>bug</span><i>→</i><span>Sentry</span><i>→</i><span>fix</span><i>→</i><span>PR</span><i>→</i><span>review</span><i>→</i><span>CI green</span><i>→</i><span>deploy</span><i>→</i><span>bug</span>
          </div>
          <p className="bot-revolution-note">
            <ExternalLink href="https://t.me/danokhlopkov/1659">Про такой agent loop я уже рассказывал на стриме о Paperclip</ExternalLink>.
          </p>
        </div>
      </section>

      <section className="bot-revolution-chapter bot-revolution-chapter-reverse">
        <div className="bot-revolution-copy">
          <h2>Не один супер-агент,<br />а нормальное разделение труда</h2>
          <p>
            Один агент ищет, другой пишет код, третий проверяет.<br className="bot-revolution-mobile-break" /> Главный помнит, что мы вообще пытаемся сделать, и подключает нужного.<br className="bot-revolution-mobile-break" /> Так контекст не превращается в бесконечную дорогую вкладку с амнезией.
          </p>

          <div className="bot-revolution-community-notes">
            <span>В OHLD Chat мне писали:</span>
            <CommunityMessage
              href="https://t.me/ohld_chat/45541"
              avatar="/assets/drafts/bot-revolution/avatars/medoedisrussia.webp"
              author="Pasha ;)"
              username="Medoedisrussia"
            >
              Grok Bot мне вообще не зашёл. Боты всё так же замыкаются в каком-то лупе — ничего внятного у меня сделать не получилось.
            </CommunityMessage>
            <CommunityMessage
              href="https://t.me/ohld_chat/45546"
              avatar="/assets/drafts/bot-revolution/avatars/dmitry-malakhov.webp"
              author="Дмитрий Малахов"
              username="Hennessy81"
            >
              Я по сути пытаюсь сделать такого Гермеса для SMM, и это оказывается очень сложно.<br /><br />
              Технически сложно всё слепить так, чтобы держалось. А продуктово — объяснить, что с ботом можно как с человеком.<br /><br />
              Короче, замкнутый круг.
            </CommunityMessage>
          </div>

          <p>
            Это пока сырой интерфейс, и Grok Bot вполне может не взлететь.<br className="bot-revolution-mobile-break" /> Но сама идея уже сдвинулась от «открой ещё один чат» к «собери мне команду».
          </p>
          <p>
            Большую разработку с нуля всё ещё удобнее вести через Claude Code, Codex или Grok CLI.<br className="bot-revolution-mobile-break" /> Grok Bot и Hermes интереснее на уже живом проекте: поддерживать прод, обсуждать фичи, делать небольшие фиксы.
          </p>
        </div>

        <figure className="bot-revolution-art">
          <img
            src="/assets/drafts/bot-revolution/bot-trinity.webp"
            alt="The Bot Trinity — три специализированных AI-бота"
            width="2048"
            height="2048"
            loading="lazy"
          />
        </figure>
      </section>

      <section className="bot-revolution-chapter bot-revolution-final-chapter">
        <figure className="bot-revolution-art">
          <img
            src="/assets/drafts/bot-revolution/one-main-hundred-agents.webp"
            alt="Один Главный и сто агентов — гигантский AI над городом"
            width="2048"
            height="2048"
            loading="lazy"
          />
        </figure>

        <div className="bot-revolution-copy">
          <h2>Один Главный —<br />сто агентов</h2>
          <p>
            Организовать это можно как маленькую компанию. Один Chief видит все проекты и держит общий борд. Остальные боты работают в каналах по функциям.
          </p>

          <div className="bot-revolution-org" aria-label="Как организовать AI-команду внутри Grok Bot">
            <div className="bot-revolution-org-head">
              <span className="bot-revolution-org-index">01</span>
              <div>
                <small>единый вход</small>
                <strong>Chief of Staff</strong>
              </div>
              <span className="bot-revolution-org-meta">общий борд / маршрутизация / контроль</span>
            </div>
            <div className="bot-revolution-org-channels">
              <div><span>02</span><strong>#dev</strong><p>код и небольшие фиксы</p></div>
              <div><span>03</span><strong>#qa</strong><p>баги и проверка</p></div>
              <div><span>04</span><strong>#brainstorm</strong><p>фичи и идеи</p></div>
            </div>
            <div className="bot-revolution-org-routine">
              <span>EVERY 1H</span>
              <strong>проверить весь борд → продолжить всё, что остановилось</strong>
            </div>
          </div>

          <p className="bot-revolution-channel-hint">
            <strong>Что здесь значит channel.</strong>{' '}
            Это не ещё одна личка с ботом, а общая рабочая комната —{' '}
            <ExternalLink href="https://forum.cursor.com/t/introducing-grok-bot/168053">group chat или thread</ExternalLink>.
            {' '}Боты видят один контекст, пишут друг другу и передают задачу дальше.
          </p>

          <p>
            У Chief одна часовая рутина: открыть общий борд, проверить задачи и продолжить всё, что остановилось. Не нужно отдельно будить каждого бота и тратить токены во всех каналах.
          </p>
          <p>
            Я уже примерно так и работаю. Кросс-проектные и личные запросы начинаю в OHLD — это единый вход. Codex сам идёт в нужные папки, раздаёт работу subagents и собирает ответ.
          </p>
          <p>
            Задачи часто не заканчиваются одной сессией. Но сохранённое остаётся в проекте, а GBrain поднимает прошлые решения и результаты. Поэтому новый запрос начинается там, где мы остановились.
          </p>

        </div>
      </section>

      <section className="bot-revolution-telegram">
        <div>
          <h2>В Telegram уже есть почти все примитивы</h2>
        </div>
        <div>
          <div className="bot-revolution-telegram-primitives" aria-label="Примитивы Telegram для AI-команды">
            <span><ExternalLink className="bot-revolution-primitive-link" href="https://core.telegram.org/bots/features#topics-in-private-chats">Топики</ExternalLink>.</span>
            <span><ExternalLink className="bot-revolution-primitive-link" href="https://core.telegram.org/bots/features#bot-to-bot-communication">Bot-to-bot</ExternalLink>.</span>
            <span><ExternalLink className="bot-revolution-primitive-link" href="https://core.telegram.org/bots/features#managed-bots">Managed Bots</ExternalLink>.</span>
          </div>
          <p className="bot-revolution-telegram-limit">
            Но сотню сотрудников в одном аккаунте пока не собрать:<br />
            <ExternalLink href="https://core.telegram.org/api/config#bots-create-limit-default">лимит — 20 своих ботов, <span className="bot-revolution-keep-together">с Premium — 40</span></ExternalLink>.
          </p>
          <p>
            Поэтому особенно интересно, что соберёт{' '}
            <ExternalLink href="https://t.me/karfly_livestream/293" className="bot-revolution-fabrika-link">
              <span className="bot-revolution-fabrika">
                <span>Fabrika</span>
                <i className="verified-icon" aria-label="Верифицировано">✔</i>
              </span>
            </ExternalLink>. Проект ещё не вышел, а рефка появится только после релиза. Но сам интерфейс <em><span className="bot-revolution-keep-together">а‑ля Grok Bot</span> в Телеграмме</em> уже почти <span className="bot-revolution-keep-together">лежит на столе</span>.
          </p>
        </div>
      </section>

      <section className="bot-revolution-cost">
        <figure className="bot-revolution-art bot-revolution-cost-art">
          <img
            src="/assets/drafts/bot-revolution/cost-variants/cost-how-much-money.webp"
            alt="А сколько это стоит — мем со Спанч Бобом и пачкой денег"
            width="2048"
            height="2048"
            loading="lazy"
          />
        </figure>
        <div className="bot-revolution-cost-copy">
          <h2 className="bot-revolution-visually-hidden">А сколько это стоит?</h2>
          <p>
            Grok Bot можно попробовать через <ExternalLink href="https://cursor.com/pricing">Cursor Pro+ за $60</ExternalLink> или <ExternalLink href="https://x.ai/pricing">SuperGrok Plus за $100</ExternalLink>. <ExternalLink href="https://x.ai/bot">SuperGrok Heavy стоит $300</ExternalLink>: в нём максимальные лимиты для Chat, Imagine, Voice, Build и ботов.
          </p>
          <p>
            $300 дороже максимальных подписок на Codex и Claude Code, которыми я пользовался: обе стоили по $200. Такая цена имеет смысл, только если пересадить на этот набор <span className="bot-revolution-keep-together">почти всю работу</span>.
          </p>
        </div>
      </section>

      <section className="bot-revolution-prompt">
        <div className="bot-revolution-prompt-heading">
          <h2>Спроси агента, который тебя знает</h2>
        </div>
        <div className="bot-revolution-prompt-column">
          <div className="bot-revolution-prompt-box">
            <code>{PROMPT}</code>
            <div className="bot-revolution-prompt-actions">
              <ExternalLink href="https://www.youtube.com/watch?v=vrgO4D_mUlA&t=667s">Промпт из видео</ExternalLink>
              <button type="button" onClick={copyPrompt}>{copied ? 'Скопировано' : 'Копировать'}</button>
            </div>
          </div>
          <p className="bot-revolution-prompt-note">
            <span>Так можно найти и свои agent loops:</span>
            <span>рутины, которые уже пора отдать ботам.</span>
          </p>
        </div>
      </section>

      <footer className="bot-revolution-footer">
        <p className="bot-revolution-footer-thesis">
          Следующая революция будет не в более умных моделях. Она будет в том, как мы с ними работаем: один Главный, сотрудники, память и рутины. Короче, сделать <span className="bot-revolution-keep-together">всё как у людей</span>.
        </p>

        <div className="bot-revolution-telegram-cards">
          <a className="bot-revolution-telegram-card" href="https://t.me/danokhlopkov" target="_blank" rel="noopener noreferrer">
            <div className="bot-revolution-telegram-card-profile">
              <img src="/assets/drafts/bot-revolution/telegram-cards/dan-channel.webp" alt="Дэн Охлопков" width="320" height="320" loading="lazy" />
              <div><span>Telegram-канал</span><strong>Дэн Охлопков</strong></div>
            </div>
            <p>Новые AI-инструменты, агентные лупы и мои эксперименты.</p>
            <span className="bot-revolution-telegram-card-action">Подписаться</span>
          </a>

          <a className="bot-revolution-telegram-card" href="https://t.me/ohld_chat" target="_blank" rel="noopener noreferrer">
            <div className="bot-revolution-telegram-card-profile">
              <img src="/assets/drafts/bot-revolution/telegram-cards/ohld-chat.webp" alt="OHLD Chat" width="320" height="320" loading="lazy" />
              <div><span>Telegram-чат</span><strong>OHLD Chat</strong></div>
            </div>
            <p>Обсудить статью и поспорить про ботов с комьюнити.</p>
            <span className="bot-revolution-telegram-card-action">Вступить</span>
          </a>
        </div>
      </footer>
    </main>
  )
}
