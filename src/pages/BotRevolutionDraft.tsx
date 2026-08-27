import { useEffect, useRef, useState } from 'react'
import { startArticleReadingTracking, trackCodeCopy } from '../analytics'
import { absoluteUrl, TELEGRAM_CHANNEL_URL } from '../site'
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

const ARTICLE_IMAGE_SIZES = '(min-width: 1100px) 500px, (min-width: 760px) 46vw, calc(100vw - 44px)'

function ResponsiveArticleImage({ src, sizes = ARTICLE_IMAGE_SIZES, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  const variant = (width: number) => src.replace(/\.webp$/i, `-${width}.webp`)
  return (
    <img
      {...props}
      src={src}
      srcSet={`${variant(640)} 640w, ${variant(1024)} 1024w, ${variant(1280)} 1280w, ${src} 2048w`}
      sizes={sizes}
    />
  )
}

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
    <a className="bot-revolution-community-message" href={href} target="_blank" rel="noopener noreferrer">
      <img src={avatar} alt={author} width="256" height="256" loading="lazy" />
      <div>
        <div className="bot-revolution-community-author">
          <strong>{author}</strong>
          <span>@{username}</span>
        </div>
        <p>{children}</p>
      </div>
    </a>
  )
}

const ARTICLE_PATH = '/ru/blog/bot-revolution/'
const ARTICLE_TITLE = 'The Bot Revolution'
const ARTICLE_DESCRIPTION = 'Следующая ступень эволюции AI-инструментов — не один агент, а целая команда.'
const ARTICLE_IMAGE = '/assets/drafts/bot-revolution/bot-weather-map.webp'
const ARTICLE_IMAGE_ALT = 'The Bot Revolution — карта с командой AI-ботов'

export function BotRevolutionArticle() {
  const [copied, setCopied] = useState(false)
  const articleRef = useRef<HTMLElement>(null)

  useDocumentMeta({
    title: `${ARTICLE_TITLE} — Даниил Охлопков`,
    description: ARTICLE_DESCRIPTION,
    canonical: absoluteUrl(ARTICLE_PATH),
    lang: 'ru',
    alternates: {
      ru: absoluteUrl(ARTICLE_PATH),
      en: absoluteUrl('/en/blog/bot-revolution/'),
      'x-default': absoluteUrl(ARTICLE_PATH),
    },
    image: absoluteUrl(ARTICLE_IMAGE),
    imageAlt: ARTICLE_IMAGE_ALT,
    type: 'article',
    publishedTime: '2026-08-26T00:00:00+03:00',
    modifiedTime: '2026-08-27T00:00:00+03:00',
    section: 'Блог',
    tags: ['AI Agents', 'Grok Bot', 'Hermes Bot', 'Telegram'],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: ARTICLE_TITLE,
      description: ARTICLE_DESCRIPTION,
      datePublished: '2026-08-26T00:00:00+03:00',
      dateModified: '2026-08-27T00:00:00+03:00',
      author: {
        '@type': 'Person',
        name: 'Даниил Охлопков',
        url: absoluteUrl('/about/'),
      },
      mainEntityOfPage: absoluteUrl(ARTICLE_PATH),
      image: absoluteUrl(ARTICLE_IMAGE),
      inLanguage: 'ru',
      articleSection: 'Блог',
      keywords: ['AI Agents', 'Grok Bot', 'Hermes Bot', 'Telegram'],
    },
  })

  useEffect(() => {
    document.body.classList.add('bot-revolution-body')
    return () => document.body.classList.remove('bot-revolution-body')
  }, [])

  useEffect(() => {
    if (!articleRef.current) return
    return startArticleReadingTracking(articleRef.current)
  }, [])

  async function copyPrompt() {
    let copiedSuccessfully = false
    try {
      await navigator.clipboard.writeText(PROMPT)
      copiedSuccessfully = true
    } catch {
      const field = document.createElement('textarea')
      field.value = PROMPT
      field.style.position = 'fixed'
      field.style.opacity = '0'
      document.body.appendChild(field)
      field.select()
      copiedSuccessfully = document.execCommand('copy')
      field.remove()
    }
    if (!copiedSuccessfully) return
    trackCodeCopy('bot_revolution_prompt')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main ref={articleRef} className="bot-revolution-page" id="article-content" lang="ru">
      <section className="bot-revolution-hero" data-analytics-section="hook" data-analytics-title="The Bot Revolution">
        <div className="bot-revolution-hero-copy">
          <p className="bot-revolution-kicker">Август 2026</p>
          <h1>The Bot<br /> Revolution</h1>
          <p className="bot-revolution-lead">
            <span>Долгожданный следующий шаг эволюции ИИ.</span>
            <strong>
              Тебе нужен не один агент,
              <br />
              а целая команда.
            </strong>
          </p>
        </div>

        <figure className="bot-revolution-art bot-revolution-hero-art">
          <ResponsiveArticleImage
            src="/assets/drafts/bot-revolution/bot-weather-map.webp"
            alt={ARTICLE_IMAGE_ALT}
            width="2048"
            height="2048"
            fetchPriority="high"
          />
        </figure>
      </section>

      <section className="bot-revolution-timeline" id="timeline" aria-label="Таймлайн AI-инструментов" data-analytics-section="evolution" data-analytics-title="Эволюция AI-инструментов">
        {timeline.map(([year, tool, take], index) => (
          <article className={index === timeline.length - 1 ? 'is-next' : undefined} key={year}>
            <span className="bot-revolution-year">{year}</span>
            <strong>{tool}</strong>
            <p>{take}</p>
          </article>
        ))}
      </section>

      <section className="bot-revolution-chapter" data-analytics-section="context_limit" data-analytics-title="Всё не засунуть в одну сессию">
        <figure className="bot-revolution-art">
          <ResponsiveArticleImage
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
            данные всех проектов<br className="bot-revolution-mobile-break" /> не уместить в одном контексте.<br />
            А так хочется иметь <code>single point of contact</code>:<br />
            писать Chief of Staff, чтобы он догрузил нужную инфу и порешал сам, <span className="bot-revolution-keep-together">делегируя работу субагентам.</span>
          </p>
          <p>
            <ExternalLink href="https://t.me/ohld_chat/45534">Grok Bot</ExternalLink>,{' '}
            <ExternalLink href="https://t.me/ohld_chat/45546">Hermes Bot</ExternalLink> и{' '}
            <ExternalLink href="https://t.me/danokhlopkov/1731">Berd</ExternalLink> почти синхронно релизнули новый формат общения ИИ: личные и групповые <span className="bot-revolution-keep-together">чаты, сотрудники, лупы.</span>
          </p>

          <div className="bot-revolution-loop" aria-label="Пример agent loop">
            <span>bug</span><i>→</i><span>Sentry</span><i>→</i><span>fix</span><i>→</i><span>PR</span><i>→</i><span>review</span><i>→</i><span>CI green</span><i>→</i><span>deploy</span><i>→</i><span>bug</span>
          </div>
          <p className="bot-revolution-note">
            <ExternalLink href="https://t.me/danokhlopkov/1659">Про такой agent loop я уже рассказывал на стриме о Paperclip</ExternalLink>.
          </p>
        </div>
      </section>

      <section className="bot-revolution-chapter bot-revolution-chapter-reverse bot-revolution-community-chapter" data-analytics-section="team_structure" data-analytics-title="Разделение труда между агентами">
        <h2 className="bot-revolution-section-title">
          <span>Не один супер-агент,</span>
          <span>а нормальное разделение труда</span>
        </h2>

        <div className="bot-revolution-copy">
          <p>
            Раньше всё это жило в одном чате с кучей md-файлов. Потом ты упаковывал процессы в <ExternalLink href="https://t.me/danokhlopkov/1725">скиллы</ExternalLink>, автоматизируя кусок работы. Я так сделал с <ExternalLink href="https://t.me/danokhlopkov/1618">анализом данных TON Blockchain</ExternalLink>.
          </p>
          <p>
            Новая волна IDE для ИИ предлагает превратить их в отдельных сотрудников. У каждого свой контекст <span className="bot-revolution-keep-together">и своя ответственность.</span>
          </p>
          <p>
            Главная инновация Grok Bot не в модели, а в интерфейсе: Telegram или Slack, только вместо людей агенты, которые могут общаться <span className="bot-revolution-keep-together">между собой.</span>
          </p>
          <p>
            Прогать, конечно же, удобнее через Codex, Claude Code, Cursor и т. п. А вот поддерживать код и автоматизировать операционку когнитивно проще через знакомую до боли схему <span className="bot-revolution-keep-together">«начальник → подчинённый».</span>
          </p>
        </div>

        <figure className="bot-revolution-art">
          <ResponsiveArticleImage
            src="/assets/drafts/bot-revolution/bot-trinity.webp"
            alt="The Bot Trinity — три специализированных AI-бота"
            width="2048"
            height="2048"
            loading="lazy"
          />
        </figure>

        <div className="bot-revolution-community-notes">
          <span>В OHLD Chat мне писали:</span>
          <div className="bot-revolution-community-grid">
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
              Я по сути пытаюсь сделать такого Гермеса для SMM, и это оказывается очень сложно.<br />
              Технически сложно всё слепить так, чтобы держалось. А продуктово — объяснить, что с ботом можно как с человеком.<br />
              Короче, замкнутый круг.
            </CommunityMessage>
          </div>
        </div>
      </section>

      <section className="bot-revolution-chapter bot-revolution-final-chapter" data-analytics-section="chief_model" data-analytics-title="Один Chief и команда агентов">
        <h2 className="bot-revolution-section-title">
          <span>Организовать это можно</span>
          <span>как маленькую компанию.</span>
        </h2>

        <div className="bot-revolution-final-visual">
          <figure className="bot-revolution-art">
            <ResponsiveArticleImage
              src="/assets/drafts/bot-revolution/one-main-hundred-agents.webp"
              alt="Один Главный и сто агентов — гигантский AI над городом"
              width="2048"
              height="2048"
              loading="lazy"
            />
          </figure>
        </div>

        <div className="bot-revolution-copy">
          <p>
            Создавая агента QA, ты даёшь ему отдельный контекст: код, тесты, баги, релизы, кастомный CLI/MCP-интерфейс для дебага прода. Маркетологу всё это <span className="bot-revolution-keep-together">вряд ли нужно.</span>
          </p>

          <p>
            Даже в стартапе из двух человек один обычно забирает техничку, второй продажи. Так просто легче <span className="bot-revolution-keep-together">менеджить ответственность.</span>
          </p>

          <p className="bot-revolution-channel-hint">
            Над ними Chief of Staff: он видит все проекты, держит общий борд и раскидывает таски.{' '}
            <span className="bot-revolution-keep-together">В&nbsp;<ExternalLink href="https://docs.x.ai/grok-bot/chat-and-collaboration">group&nbsp;chat</ExternalLink></span>{' '}
            собираете 2–6 ботов вокруг общей задачи: у них один разговор на всех, они пишут туда сами и передают работу друг другу. Именно эта архитектура завирусилась <span className="bot-revolution-keep-together">в твиттере.</span>
          </p>

          <p>
            У Начальника одна рутина раз в час: проверить статус и продолжить всё, что остановилось. Не нужно отдельно будить каждого сотрудника: он сам всё <span className="bot-revolution-keep-together">замикроменеджит.</span>
          </p>

        </div>
      </section>

      <section className="bot-revolution-telegram" data-analytics-section="telegram_primitives" data-analytics-title="Примитивы Telegram для AI-команды">
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
            Но сотню сотрудников<br />в одном аккаунте <span className="bot-revolution-keep-together">пока не собрать:</span><br />
            <ExternalLink href="https://core.telegram.org/api/config#bots-create-limit-default">лимит BotFather — 20 ботов, <span className="bot-revolution-keep-together">с Premium — 40</span></ExternalLink>.
          </p>
          <p>
            Поэтому особенно интересно,<br />
            что покажет нам{' '}
            <ExternalLink href="https://t.me/karfly_livestream/293" className="bot-revolution-fabrika-link">
              <span className="bot-revolution-fabrika">
                <span>Fabrika</span>
                <i className="verified-icon" aria-label="Верифицировано">✔</i>
              </span>
            </ExternalLink>.
          </p>
        </div>
      </section>

      <section className="bot-revolution-cost" data-analytics-section="pricing" data-analytics-title="Сколько стоит AI-команда">
        <figure className="bot-revolution-art bot-revolution-cost-art">
          <ResponsiveArticleImage
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
            Ну а я планирую брать <ExternalLink href="https://x.ai/bot">SuperGrok Heavy за $300</ExternalLink>: <ExternalLink href="https://cursor.com/help/grok-bot/plans">максимальные лимиты Grok Bot идут в подарок</ExternalLink>. В итоге и прогать можно норм через Grok CLI, и операционку автоматизировать <span className="bot-revolution-keep-together">в знакомом чате.</span>
          </p>
          <p>
            $300 кусается сильнее максимальных Codex и Claude Code за $200. Но на тарифах по $100 я уже постоянно упираюсь в потолок. Жду, когда у меня закончатся лимиты в Codex, чтобы таки депнуть Гроку. Правда, <ExternalLink href="https://t.me/ohld_chat/45884">Tibo</ExternalLink> всё ресетит <span className="bot-revolution-keep-together">и ресетит. Лол.</span>
          </p>
        </div>
      </section>

      <section className="bot-revolution-prompt bot-revolution-reflection" data-analytics-section="reflection" data-analytics-title="Нужна ли мне команда AI-сотрудников">
        <div className="bot-revolution-prompt-heading">
          <h2>А я точно хочу такую команду?</h2>
        </div>
        <div className="bot-revolution-copy bot-revolution-reflection-copy">
          <p>
            Человековские иерархии могут быть неидеальными для ИИ-агентов. Но начать можно с того, <span className="bot-revolution-keep-together">что реально работает.</span>
          </p>
          <p>
            <ExternalLink href="https://x.com/simonw/status/2075996740717871125?s=20">Создатель Django</ExternalLink> (топ либа для питона) думает, что сама идея «ИИ-сотрудника» унижает человеков (лол). Но живой менеджер всё ещё нужен: кто-то должен <span className="bot-revolution-keep-together">взять ответственность.</span>
          </p>
          <p>
            <ExternalLink href="https://www.gatesnotes.com/home/home-page-topic/reader/a-turbulent-ai-era-and-critical-choices-to-make">Билл Гейтс недавно писал</ExternalLink>, что пора брать налог с AI-токенов и роботов. Я готов платить, если команда за $300/мес когда-нибудь заменит человека за $3000. Только пока непонятно, с чего: с токенов, результата <span className="bot-revolution-keep-together">или сэкономленной зарплаты.</span>
          </p>
        </div>
      </section>

      <section className="bot-revolution-prompt" data-analytics-section="personal_prompt" data-analytics-title="Промпт для настройки команды">
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

      <footer className="bot-revolution-footer" data-analytics-section="conclusion" data-analytics-title="Вывод и подписка">
        <p className="bot-revolution-footer-thesis">
          <span>Следующая революция будет<br className="bot-revolution-mobile-break" /> не в более умных моделях.</span>
          <span>Она будет в том, как мы с ними работаем.</span>
          <strong>Подписывайся</strong>
        </p>

        <div className="bot-revolution-telegram-cards">
          <a className="bot-revolution-telegram-card" href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" data-cta-id="bot_revolution_channel">
            <div className="bot-revolution-telegram-card-profile">
              <img src="/assets/drafts/bot-revolution/telegram-cards/dan-channel.webp" alt="Дэн Охлопков" width="320" height="320" loading="lazy" />
              <div><span>Telegram-канал</span><strong>Дэн Охлопков</strong></div>
            </div>
            <span className="bot-revolution-telegram-card-action">Подписаться</span>
          </a>

          <a className="bot-revolution-telegram-card" href="https://t.me/ohld_chat" target="_blank" rel="noopener noreferrer" data-cta-id="bot_revolution_chat">
            <div className="bot-revolution-telegram-card-profile">
              <img src="/assets/drafts/bot-revolution/telegram-cards/ohld-chat.webp" alt="OHLD Chat" width="320" height="320" loading="lazy" />
              <div><span>Telegram-чат</span><strong>OHLD Chat</strong></div>
            </div>
            <span className="bot-revolution-telegram-card-action">Вступить</span>
          </a>
        </div>
      </footer>
    </main>
  )
}
