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

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}<span aria-hidden="true">↗</span>
    </a>
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
            Кажется, следующая ступень AI-инструментов уже началась. AI перестаёт быть одной дорогой сессией и превращается в команду.
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
            Опытные AI-разработчики уже поняли: всю инфу про всё не засунуть в контекст одной сессии. А так хочется иметь <code>single point of contact</code>: писать Главному, чтобы он прочитал нужное и порешал сам.
          </p>
          <p>
            <ExternalLink href="https://t.me/ohld_chat/45534">Grok Bot</ExternalLink>,{' '}
            <ExternalLink href="https://t.me/ohld_chat/45546">Hermes Bot</ExternalLink> и{' '}
            <ExternalLink href="https://t.me/danokhlopkov/1731">Berd</ExternalLink> превращают такую специализацию в отдельного агента. У каждого своя память, инструменты, триггеры и рутины.
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
            Один агент ищет, другой пишет код, третий проверяет. Главный помнит, что мы вообще пытаемся сделать, и подключает нужного. Так контекст не превращается в бесконечную дорогую вкладку с амнезией.
          </p>

          <blockquote>
            <p>
              В <ExternalLink href="https://t.me/ohld_chat/45541">OHLD Chat</ExternalLink> справедливо возразили: боты легко замыкаются в луп, иногда проще писать одному сильному агенту, а хайпа пока больше, чем результата.
            </p>
          </blockquote>

          <p>
            Согласен. Grok Bot может не взлететь. Но это не отменяет новую парадигму: интерфейс уже сместился от «открой ещё один чат» к «собери мне команду».
          </p>
          <p>
            Большую разработку с нуля всё ещё удобнее вести через Claude Code, Codex или Grok CLI. Grok Bot и Hermes интереснее на уже живом проекте: поддерживать прод, обсуждать фичи, делать небольшие фиксы.
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
            Павел Игнатьев собирает это буквально как маленькую компанию. Один Chief сидит во всех проектах и держит у себя общий борд. Часовая рутина запускается только у него: он разом проверяет все задачи и продолжает то, что где-то остановилось.
          </p>
          <p>
            Я уже примерно так и работаю. Кросс-проектные и личные запросы начинаю из OHLD — это мой единый вход. Codex сам идёт в нужные папки проектов, отдаёт отдельные куски subagents и собирает мне ответ.
          </p>
          <p>
            Задачи часто не заканчиваются одной сессией. Но всё, что агент сохранил в проекте, никуда не исчезает, а GBrain помогает поднять прошлые решения и результаты. Поэтому новый запрос начинается не с нуля, а с того места, где мы остановились.
          </p>

          <dl className="bot-revolution-stack">
            <div><dt>Главный</dt><dd>понимает задачу и маршрутизирует</dd></div>
            <div><dt>Память</dt><dd>достаёт нужный контекст между сессиями</dd></div>
            <div><dt>Агенты</dt><dd>делают узкую работу и возвращают результат</dd></div>
          </dl>
        </div>
      </section>

      <section className="bot-revolution-telegram">
        <div>
          <h2>В Telegram уже есть почти все примитивы</h2>
        </div>
        <div>
          <p>
            Форумы и топики. Bot-to-bot. Managed Bots. Даже текущий <ExternalLink href="https://core.telegram.org/api/config">лимит</ExternalLink> похож на размер команды: 20 ботов, с Premium 40.
          </p>
          <p>
            Поэтому особенно интересно, что соберёт{' '}
            <ExternalLink href="https://t.me/karfly_livestream/293">
              <span className="bot-revolution-fabrika">
                Fabrika
                <i className="verified-icon" aria-label="Верифицировано">✔</i>
              </span>
            </ExternalLink>. Проект ещё не вышел, а рефка появится только на релизе. Но сам интерфейс а-ля <em>Grok Bot в Телеграмме</em> уже почти лежит на столе.
          </p>
        </div>
      </section>

      <section className="bot-revolution-cost">
        <h2>А сколько это стоит?</h2>
        <div>
          <p>
            На первый взгляд Grok Bot — игрушка за <strong>$300 в месяц</strong>: столько стоит максимальный <ExternalLink href="https://x.ai/bot">SuperGrok Heavy</ExternalLink>. Это дороже любой из моих AI-подписок: максимальные тарифы Codex и Claude Code, которыми я пользовался, стоили по $200.
          </p>
          <p>
            Но $300 уже не входной билет. Сам Grok Bot можно попробовать через <ExternalLink href="https://cursor.com/pricing">Cursor Pro+ за $60</ExternalLink> или <ExternalLink href="https://x.ai/pricing">SuperGrok Plus за $100</ExternalLink>. Heavy нужен, если хочется максимальных лимитов для Chat, Imagine, Voice, Build и ботов. То есть попробовать можно за $60. $300 имеет смысл, только если вы хотите пересадить на это почти всю работу.
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
        <p>Мне кажется, следующая революция не в ещё одном умном чате. AI-команду наконец можно собрать как обычную: назначить Главного, раздать работу и перестать объяснять всё заново в каждой сессии. Короче, сделать всё как у людей.</p>
        <div>
          <ExternalLink href="https://t.me/ohld_chat/45541">Обсудить в OHLD Chat</ExternalLink>
          <ExternalLink href="https://t.me/danokhlopkov">Telegram-канал</ExternalLink>
        </div>
      </footer>
    </main>
  )
}
