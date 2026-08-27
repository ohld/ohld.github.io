import { useEffect, useRef, useState } from 'react'
import { startArticleReadingTracking, trackCodeCopy } from '../analytics'
import { absoluteUrl, TELEGRAM_CHANNEL_URL } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'
import './BotRevolutionDraft.css'

const PROMPT = 'Based on what you know about me, how would you set up GrokBot? Which bots should we set up?'

const timeline = [
  ['2023', 'ChatGPT', 'AI searches better'],
  ['2024', 'Cursor', 'AI helps you code'],
  ['2025', 'Claude Code', 'AI codes better'],
  ['2026', 'OpenClaw', 'AI plugs into services'],
  ['2026.5', 'The Bot Revolution', 'AI becomes a team'],
]

const ARTICLE_IMAGE_SIZES = '(min-width: 1100px) 500px, (min-width: 760px) 46vw, calc(100vw - 44px)'

function ResponsiveArticleImage({
  src,
  sizes = ARTICLE_IMAGE_SIZES,
  masterWidth = 2048,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; masterWidth?: number }) {
  const variant = (width: number) => src.replace(/\.webp$/i, `-${width}.webp`)
  const variantWidths = (masterWidth >= 1280 ? [640, 1024, 1280] : [640, 1024])
    .filter((width) => width < masterWidth)
  const srcSet = [...variantWidths.map((width) => `${variant(width)} ${width}w`), `${src} ${masterWidth}w`].join(', ')
  return <img {...props} src={src} srcSet={srcSet} sizes={sizes} />
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

const ARTICLE_PATH = '/en/blog/bot-revolution/'
const RUSSIAN_ARTICLE_PATH = '/ru/blog/bot-revolution/'
const ARTICLE_TITLE = 'The Bot Revolution'
const ARTICLE_DESCRIPTION = 'The next step in AI tools is not one agent, but an entire team.'
const ARTICLE_IMAGE = '/assets/drafts/bot-revolution/bot-weather-map.webp'
const ARTICLE_IMAGE_ALT = 'The Bot Revolution — a weather map for a distributed team of AI bots'

export function EnglishBotRevolutionArticle() {
  const [copied, setCopied] = useState(false)
  const articleRef = useRef<HTMLElement>(null)

  useDocumentMeta({
    title: `${ARTICLE_TITLE} — Daniil Okhlopkov`,
    description: ARTICLE_DESCRIPTION,
    canonical: absoluteUrl(ARTICLE_PATH),
    lang: 'en',
    alternates: {
      ru: absoluteUrl(RUSSIAN_ARTICLE_PATH),
      en: absoluteUrl(ARTICLE_PATH),
      'x-default': absoluteUrl(RUSSIAN_ARTICLE_PATH),
    },
    image: absoluteUrl(ARTICLE_IMAGE),
    imageAlt: ARTICLE_IMAGE_ALT,
    type: 'article',
    publishedTime: '2026-08-26T00:00:00+03:00',
    modifiedTime: '2026-08-26T00:00:00+03:00',
    section: 'Blog',
    tags: ['AI Agents', 'Grok Bot', 'Hermes Bot', 'Telegram'],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: ARTICLE_TITLE,
      description: ARTICLE_DESCRIPTION,
      datePublished: '2026-08-26T00:00:00+03:00',
      dateModified: '2026-08-26T00:00:00+03:00',
      author: {
        '@type': 'Person',
        name: 'Daniil Okhlopkov',
        url: absoluteUrl('/en/about/'),
      },
      mainEntityOfPage: absoluteUrl(ARTICLE_PATH),
      image: absoluteUrl(ARTICLE_IMAGE),
      inLanguage: 'en',
      articleSection: 'Blog',
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
    <main ref={articleRef} className="bot-revolution-page" id="article-content" lang="en">
      <section className="bot-revolution-hero" data-analytics-section="hook" data-analytics-title="The Bot Revolution">
        <div className="bot-revolution-hero-copy">
          <p className="bot-revolution-kicker">August 2026</p>
          <h1>The Bot<br /> Revolution</h1>
          <p className="bot-revolution-lead">
            <span>The long-awaited next step in AI evolution.</span>
            <strong>
              You don’t need one agent.
              <br />
              You need a whole team.
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

      <section className="bot-revolution-timeline" id="timeline" aria-label="AI tools timeline" data-analytics-section="evolution" data-analytics-title="The evolution of AI tools">
        {timeline.map(([year, tool, take], index) => (
          <article className={index === timeline.length - 1 ? 'is-next' : undefined} key={year}>
            <span className="bot-revolution-year">{year}</span>
            <strong>{tool}</strong>
            <p>{take}</p>
          </article>
        ))}
      </section>

      <section className="bot-revolution-chapter" data-analytics-section="context_limit" data-analytics-title="You can’t cram everything into one session">
        <figure className="bot-revolution-art">
          <ResponsiveArticleImage
            src="/assets/drafts/bot-revolution/ai-becomes-team-en.webp"
            alt="AI becomes a team — surreal digital collage"
            width="1254"
            height="1254"
            masterWidth={1254}
            loading="lazy"
          />
        </figure>

        <div className="bot-revolution-copy">
          <h2>You can’t cram everything<br />into one session</h2>
          <p>
            Experienced AI developers already know this:<br />
            you can’t fit every project<br className="bot-revolution-mobile-break" /> into one context.<br />
            But you still want a <code>single point of contact</code>:<br />
            message a Chief of Staff, have it load the right context, solve the problem, and <span className="bot-revolution-keep-together">delegate the work to subagents.</span>
          </p>
          <p>
            <ExternalLink href="https://t.me/ohld_chat/45534">Grok Bot</ExternalLink>,{' '}
            <ExternalLink href="https://t.me/ohld_chat/45546">Hermes Bot</ExternalLink>, and{' '}
            <ExternalLink href="https://t.me/danokhlopkov/1731">Berd</ExternalLink> almost simultaneously shipped a new way to work with agents: DMs and group chats, employees, and loops.
          </p>

          <div className="bot-revolution-loop" aria-label="Example agent loop">
            <span>bug</span><i>→</i><span>Sentry</span><i>→</i><span>fix</span><i>→</i><span>PR</span><i>→</i><span>review</span><i>→</i><span>CI green</span><i>→</i><span>deploy</span><i>→</i><span>bug</span>
          </div>
          <p className="bot-revolution-note">
            <ExternalLink href="https://t.me/danokhlopkov/1659">I covered this kind of agent loop on my Paperclip stream</ExternalLink>.
          </p>
        </div>
      </section>

      <section className="bot-revolution-chapter bot-revolution-chapter-reverse bot-revolution-community-chapter" data-analytics-section="team_structure" data-analytics-title="Division of labor between agents">
        <h2 className="bot-revolution-section-title">
          <span>Not one super-agent,</span>
          <span>but actual division of labor</span>
        </h2>

        <div className="bot-revolution-copy">
          <p>
            One agent researches, one codes, one reviews. The Chief remembers what we’re trying to do and pulls in the right specialist. The context no longer becomes one endlessly expensive <span className="bot-revolution-keep-together">tab with amnesia.</span>
          </p>
          <p>
            The interface is still raw, and Grok Bot may well fail. But the idea has already shifted from “open another chat” to “build me a team.”
          </p>
          <p>
            Greenfield development is still easier in Claude Code, Codex, or Grok CLI. Grok Bot and Hermes are more interesting on a live project: keeping prod running, discussing features, and shipping small fixes.
          </p>
        </div>

        <figure className="bot-revolution-art">
          <ResponsiveArticleImage
            src="/assets/drafts/bot-revolution/bot-trinity.webp"
            alt="The Bot Trinity — three specialized AI bots"
            width="2048"
            height="2048"
            loading="lazy"
          />
        </figure>

        <div className="bot-revolution-community-notes">
          <span>People in OHLD Chat told me:</span>
          <div className="bot-revolution-community-grid">
            <CommunityMessage
              href="https://t.me/ohld_chat/45541"
              avatar="/assets/drafts/bot-revolution/avatars/medoedisrussia.webp"
              author="Pasha ;)"
              username="Medoedisrussia"
            >
              Grok Bot didn’t work for me at all. The bots still get stuck in some kind of loop — I couldn’t get a useful result out of them.
            </CommunityMessage>
            <CommunityMessage
              href="https://t.me/ohld_chat/45546"
              avatar="/assets/drafts/bot-revolution/avatars/dmitry-malakhov.webp"
              author="Dmitry Malakhov"
              username="Hennessy81"
            >
              I’m basically trying to build a Hermes for SMM, and it turns out to be very hard.<br />
              Technically, it’s hard to glue everything together so it holds. Product-wise, it’s hard to explain that you can work with the bot like a person.<br />
              A vicious circle, basically.
            </CommunityMessage>
          </div>
        </div>
      </section>

      <section className="bot-revolution-chapter bot-revolution-final-chapter" data-analytics-section="chief_model" data-analytics-title="One Chief and a team of agents">
        <h2 className="bot-revolution-section-title">
          <span>You can organize it</span>
          <span>like a small company.</span>
        </h2>

        <div className="bot-revolution-final-visual">
          <figure className="bot-revolution-art">
            <ResponsiveArticleImage
              src="/assets/drafts/bot-revolution/one-main-hundred-agents-en.webp"
              alt="One Boss and 100 agents — English adaptation of the original meme"
              width="1024"
              height="1024"
              masterWidth={1024}
              loading="lazy"
            />
          </figure>
        </div>

        <div className="bot-revolution-copy">
          <p>
            One Chief sees every project and keeps the shared board. The other bots <span className="bot-revolution-keep-together">work within their own functions.</span>
          </p>

          <p className="bot-revolution-channel-hint">
            In a DM, one bot holds the context.{' '}
            <span className="bot-revolution-keep-together">In a&nbsp;<ExternalLink href="https://docs.x.ai/grok-bot/chat-and-collaboration">group&nbsp;chat</ExternalLink></span>{' '}
            you bring 2–6 bots around one shared task: they see the same conversation, post on their own, and hand work to one another.
          </p>

          <p>
            The Chief has one hourly routine: open the shared board, check every task, and continue anything that stopped. No need to wake each bot separately and burn tokens in every chat.
          </p>
          <p>
            This is already close to how I work. I start cross-project and personal requests from my iCloud folder — it’s the single entry point. Codex goes into the right project folders, delegates work to subagents, and assembles the answer.
          </p>
          <p>
            Tasks often take more than one session. But saved work stays in the project, and <ExternalLink href="https://t.me/danokhlopkov/1685">GBrain</ExternalLink> brings back past decisions and results. So every new request starts <span className="bot-revolution-keep-together">where we left off.</span>
          </p>
        </div>
      </section>

      <section className="bot-revolution-telegram" data-analytics-section="telegram_primitives" data-analytics-title="Telegram primitives for an AI team">
        <div>
          <h2>Telegram already has almost all the primitives</h2>
        </div>
        <div>
          <div className="bot-revolution-telegram-primitives" aria-label="Telegram primitives for an AI team">
            <span><ExternalLink className="bot-revolution-primitive-link" href="https://core.telegram.org/bots/features#topics-in-private-chats">Topics</ExternalLink>.</span>
            <span><ExternalLink className="bot-revolution-primitive-link" href="https://core.telegram.org/bots/features#bot-to-bot-communication">Bot-to-bot</ExternalLink>.</span>
            <span><ExternalLink className="bot-revolution-primitive-link" href="https://core.telegram.org/bots/features#managed-bots">Managed Bots</ExternalLink>.</span>
          </div>
          <p className="bot-revolution-telegram-limit">
            But you still can’t put a hundred employees<br />under one account:<br />
            <ExternalLink href="https://core.telegram.org/api/config#bots-create-limit-default">BotFather caps you at 20 bots, <span className="bot-revolution-keep-together">or 40 with Premium</span></ExternalLink>.
          </p>
          <p>
            Which is why I’m especially curious<br />
            to see what{' '}
            <ExternalLink href="https://t.me/karfly_livestream/293" className="bot-revolution-fabrika-link">
              <span className="bot-revolution-fabrika">
                <span>Fabrika</span>
                <i className="verified-icon" aria-label="Verified">✔</i>
              </span>
            </ExternalLink>{' '}
            ships.
          </p>
        </div>
      </section>

      <section className="bot-revolution-cost" data-analytics-section="pricing" data-analytics-title="The cost of an AI team">
        <figure className="bot-revolution-art bot-revolution-cost-art">
          <ResponsiveArticleImage
            src="/assets/drafts/bot-revolution/cost-variants/cost-how-much-money-en.webp"
            alt="So how much does it cost — SpongeBob holding a stack of money"
            width="1254"
            height="1254"
            masterWidth={1254}
            loading="lazy"
          />
        </figure>
        <div className="bot-revolution-cost-copy">
          <h2 className="bot-revolution-visually-hidden">So how much does it cost?</h2>
          <p>
            You can try Grok Bot with <ExternalLink href="https://cursor.com/pricing">Cursor Pro+ for $60</ExternalLink> or <ExternalLink href="https://x.ai/pricing">SuperGrok Plus for $100</ExternalLink>. <ExternalLink href="https://x.ai/bot">SuperGrok Heavy costs $300</ExternalLink>:<br />
            <span className="bot-revolution-cost-detail">it comes with the highest limits for Chat, Imagine, Voice, Build, <span className="bot-revolution-keep-together">and bots.</span></span>
          </p>
          <p>
            $300 stings more than the top Codex and Claude Code plans at $200. The $100 limits are already too tight for me, so I’m going straight to $300. Time to try getting that reimbursed 👹
          </p>
        </div>
      </section>

      <section className="bot-revolution-prompt" data-analytics-section="personal_prompt" data-analytics-title="A prompt for designing your team">
        <div className="bot-revolution-prompt-heading">
          <h2>Ask the agent that already knows you</h2>
        </div>
        <div className="bot-revolution-prompt-column">
          <div className="bot-revolution-prompt-box">
            <code>{PROMPT}</code>
            <div className="bot-revolution-prompt-actions">
              <ExternalLink href="https://www.youtube.com/watch?v=vrgO4D_mUlA&t=667s">Prompt from the video</ExternalLink>
              <button type="button" onClick={copyPrompt}>{copied ? 'Copied' : 'Copy'}</button>
            </div>
          </div>
          <p className="bot-revolution-prompt-note">
            <span>You can use it to find your own agent loops too:</span>
            <span>routines that should already belong to a bot.</span>
          </p>
        </div>
      </section>

      <footer className="bot-revolution-footer" data-analytics-section="conclusion" data-analytics-title="Conclusion and subscription">
        <p className="bot-revolution-footer-thesis">
          <span>The next revolution won’t come<br className="bot-revolution-mobile-break" /> from smarter models.</span>
          <span>It will come from how we work with them.</span>
          <strong>Follow along</strong>
        </p>

        <div className="bot-revolution-telegram-cards">
          <a className="bot-revolution-telegram-card" href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" data-cta-id="bot_revolution_channel">
            <div className="bot-revolution-telegram-card-profile">
              <img src="/assets/drafts/bot-revolution/telegram-cards/dan-channel.webp" alt="Dan Okhlopkov" width="320" height="320" loading="lazy" />
              <div><span>Telegram channel</span><strong>Dan Okhlopkov</strong></div>
            </div>
            <span className="bot-revolution-telegram-card-action">Follow</span>
          </a>

          <a className="bot-revolution-telegram-card" href="https://x.com/danokhlopkov" target="_blank" rel="noopener noreferrer" data-cta-id="bot_revolution_x">
            <div className="bot-revolution-telegram-card-profile">
              <img src="/assets/drafts/bot-revolution/telegram-cards/dan-x.webp" alt="okhlopkov.ton on X" width="320" height="320" loading="lazy" />
              <div><span>X · @danokhlopkov</span><strong>okhlopkov.ton</strong></div>
            </div>
            <span className="bot-revolution-telegram-card-action">Follow</span>
          </a>
        </div>
      </footer>
    </main>
  )
}
