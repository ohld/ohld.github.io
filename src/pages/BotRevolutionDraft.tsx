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
            Организовать это можно как маленькую компанию.<br className="bot-revolution-mobile-break" /> Один Chief сидит во всех проектах и держит у себя общий борд.<br className="bot-revolution-mobile-break" /> Остальные боты работают в отдельных каналах по функциям.
          </p>

          <div className="bot-revolution-org" aria-label="Как организовать AI-команду внутри Grok Bot">
            <div className="bot-revolution-org-chief">
              <span>single point of contact</span>
              <strong>Chief of Staff</strong>
              <small>общий борд · маршрутизация · контроль</small>
            </div>
            <div className="bot-revolution-org-connector" aria-hidden="true" />
            <div className="bot-revolution-org-channels">
              <div><strong># dev</strong><span>код и небольшие фиксы</span></div>
              <div><strong># QA</strong><span>баги и проверка</span></div>
              <div><strong># brainstorm</strong><span>фичи и идеи</span></div>
            </div>
            <div className="bot-revolution-org-routine">
              <strong>раз в час</strong>
              <span>проверить весь борд → продолжить остановившиеся задачи</span>
            </div>
          </div>

          <p className="bot-revolution-channel-hint">
            <strong>Что здесь значит channel.</strong>{' '}
            Это не ещё одна личка с ботом, а общая рабочая комната —{' '}
            <ExternalLink href="https://forum.cursor.com/t/introducing-grok-bot/168053">group chat или thread</ExternalLink>.
            {' '}Боты видят один контекст, пишут друг другу и передают задачу дальше.
          </p>

          <p>
            Напоминание ставится только Chief.<br className="bot-revolution-mobile-break" /> Раз в час он открывает весь борд, проверяет задачи и продолжает то, что остановилось.<br className="bot-revolution-mobile-break" /> Не нужно будить каждого бота по отдельности и тратить токены во всех каналах.
          </p>
          <p>
            Я уже примерно так и работаю.<br className="bot-revolution-mobile-break" /> Кросс-проектные и личные запросы начинаю из OHLD — это мой единый вход.<br className="bot-revolution-mobile-break" /> Codex сам идёт в нужные папки проектов, отдаёт отдельные куски subagents и собирает мне ответ.
          </p>
          <p>
            Задачи часто не заканчиваются одной сессией.<br className="bot-revolution-mobile-break" /> Но всё, что агент сохранил в проекте, никуда не исчезает, а GBrain помогает поднять прошлые решения и результаты.<br className="bot-revolution-mobile-break" /> Поэтому новый запрос начинается не с нуля, а с того места, где мы остановились.
          </p>

        </div>
      </section>

      <section className="bot-revolution-telegram">
        <div>
          <h2>В Telegram уже есть почти все примитивы</h2>
        </div>
        <div>
          <p>
            Форумы и топики. Bot-to-bot. Managed Bots.<br className="bot-revolution-mobile-break" /> Даже текущий <ExternalLink href="https://core.telegram.org/api/config">лимит</ExternalLink> похож на размер команды: 20 ботов, с Premium 40.
          </p>
          <p>
            Поэтому особенно интересно, что соберёт{' '}
            <ExternalLink href="https://t.me/karfly_livestream/293" className="bot-revolution-fabrika-link">
              <span className="bot-revolution-fabrika">
                <span>Fabrika</span>
                <i className="verified-icon" aria-label="Верифицировано">✔</i>
              </span>
            </ExternalLink>.<br className="bot-revolution-mobile-break" /> Проект ещё не вышел, а рефка появится только на релизе.<br className="bot-revolution-mobile-break" /> Но сам интерфейс а-ля <em>Grok Bot в Телеграмме</em> уже почти лежит на столе.
          </p>
        </div>
      </section>

      <section className="bot-revolution-cost">
        <h2>А сколько это стоит?</h2>
        <div>
          <p>
            На первый взгляд Grok Bot — игрушка за <strong>$300 в месяц</strong>: столько стоит максимальный <ExternalLink href="https://x.ai/bot">SuperGrok Heavy</ExternalLink>.<br className="bot-revolution-mobile-break" /> Это дороже любой из моих AI-подписок: максимальные тарифы Codex и Claude Code, которыми я пользовался, стоили по $200.
          </p>
          <p>
            Но $300 уже не входной билет.<br className="bot-revolution-mobile-break" /> Сам Grok Bot можно попробовать через <ExternalLink href="https://cursor.com/pricing">Cursor Pro+ за $60</ExternalLink> или <ExternalLink href="https://x.ai/pricing">SuperGrok Plus за $100</ExternalLink>.<br className="bot-revolution-mobile-break" /> Heavy нужен, если хочется максимальных лимитов для Chat, Imagine, Voice, Build и ботов.<br className="bot-revolution-mobile-break" /> То есть попробовать можно за $60.<br className="bot-revolution-mobile-break" /> $300 имеет смысл, только если вы хотите пересадить на это почти всю работу.
          </p>
        </div>
      </section>

      <section className="bot-revolution-prompt">
        <div className="bot-revolution-prompt-heading">
          <h2>Спроси агента,<br />который уже тебя знает</h2>
        </div>
        <div className="bot-revolution-prompt-column">
          <div className="bot-revolution-prompt-box">
            <code>{PROMPT}</code>
            <div className="bot-revolution-prompt-actions">
              <ExternalLink href="https://www.youtube.com/watch?v=vrgO4D_mUlA&t=667s">Промпт из видео</ExternalLink>
              <button type="button" onClick={copyPrompt}>{copied ? 'Скопировано' : 'Копировать'}</button>
            </div>
          </div>
          <p className="bot-revolution-prompt-note">Также работает, чтобы найти свои agent loops: какие повторяющиеся задачи уже пора отдать отдельным ботам.</p>
        </div>
      </section>

      <footer className="bot-revolution-footer">
        <p>Мне кажется, следующая революция не в ещё одном умном чате.<br className="bot-revolution-mobile-break" /> AI-команду наконец можно собрать как обычную: назначить Главного, раздать работу и перестать объяснять всё заново в каждой сессии.<br className="bot-revolution-mobile-break" /> Короче, сделать всё как у людей.</p>
        <div>
          <ExternalLink href="https://t.me/ohld_chat/45541">Обсудить в OHLD Chat</ExternalLink>
          <ExternalLink href="https://t.me/danokhlopkov">Telegram-канал</ExternalLink>
        </div>
      </footer>
    </main>
  )
}
