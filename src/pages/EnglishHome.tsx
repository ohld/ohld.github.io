import { ArticlePreviewCard } from '../components/ArticlePreviewCard'
import { Footer } from '../components/Footer'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'
import { englishArticleItems, englishBlogItems, latestUniqueItems } from '../blog'

const latestWritingItems = latestUniqueItems([...englishBlogItems, ...englishArticleItems], 6)

export function EnglishHome() {
  useDocumentMeta({
    title: 'Daniil Okhlopkov — AI agents, data, TON and Telegram',
    description: 'Practical notes on AI agents, OpenClaw, Hermes Agent, Codex, Claude Code, MCP, TON analytics and Telegram automation by Daniil Okhlopkov.',
    canonical: absoluteUrl('/en/'),
    lang: 'en',
    alternates: {
      ru: absoluteUrl('/ru/'),
      en: absoluteUrl('/en/'),
      'x-default': absoluteUrl('/'),
    },
  })

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header-name">Daniil Okhlopkov</h1>
        <p className="page-header-bio">
          AI-native analytics, on-chain data, Telegram and agent workflows.
          This page is for fresh writing and practical notes from the tools I
          actually test. Background, work history and links live on
          <a href="/en/about/"> About</a>.
        </p>
      </header>

      <main className="home-latest" aria-label="Latest writing">
        <section className="home-section home-latest-section" aria-labelledby="home-latest">
          <div className="home-section-heading">
            <div>
              <h2 id="home-latest">Latest Writing</h2>
            </div>
            <div className="home-section-actions">
              <a className="home-section-link" href="/en/blog/">Blog</a>
              <a className="home-section-link" href="/en/articles/">Articles</a>
            </div>
          </div>
          <div className="blog-preview-grid">
            {latestWritingItems.map((article) => (
              <ArticlePreviewCard article={article} imageLoading="eager" tagsLabel="Tags" key={article.path} />
            ))}
          </div>
        </section>

        <section className="home-section home-detail-section" aria-labelledby="home-guide">
          <h2 id="home-guide">What to Read Here</h2>
          <p>
            The homepage is a map of recent writing, not another copy of my
            resume. I keep it focused on tools and workflows that are being
            tested in actual work: AI agents, Codex and Claude Code operating
            loops, on-chain analytics, Telegram automation and personal systems
            for project memory.
          </p>
          <p>
            Blog posts are pieces that grew out of my Telegram writing: the
            original idea stays recognizable, then gets enriched with context,
            links, examples and notes from other sources. Articles are separate
            search-driven topics that need a denser guide, comparison, tables,
            prompts and takeaways. Both formats matter: shorter posts provide
            context, longer articles help unpack the subject in more depth.
          </p>
          <p>
            Some notes are short and useful as a quick reference before solving
            a similar task. Other pieces are longer: they unpack context,
            constraints, alternatives and the practical result. The simple idea
            is that the site should work as a useful archive of tested findings,
            not a display case, so a link is worth revisiting a week later or
            sending to someone with the same question. Everything is written for
            practice, not reporting.
          </p>
        </section>

        <section className="home-section home-detail-section" aria-labelledby="home-topics">
          <h2 id="home-topics">Main Topics</h2>
          <p>
            If this is your first visit, start with the pieces about my AI
            setup, agent workflows and tool reviews that already went through
            real work. I try to write down concrete takeaways rather than
            abstract impressions: what made the work faster, where the process
            had to change, which settings are worth copying and which lessons
            should be kept for the next project.
          </p>
          <p>
            From there, it is easiest to follow the topic pages: AI agents for
            practical work, Codex and Claude Code for development, TON data for
            research, Telegram automation for products and channels, second
            brain systems for personal memory. A useful article here should help
            with a next step: test a hypothesis, build a prototype, tune a
            workflow or avoid a mistake that already showed up in practice.
          </p>
          <ul className="home-detail-list">
            <li>
              <a href="/topics/ai-agents/">AI agents</a> — practical workflows
              where an agent reads context, works with files, checks its own
              output and carries a task through to a concrete result.
            </li>
            <li>
              <a href="/topics/claude-code/">Claude Code</a> and
              <a href="/topics/codex/"> Codex</a> — skills, MCP, hooks, browser
              smoke checks, diff review and long tasks that need a controlled
              operating loop.
            </li>
            <li>
              <a href="/topics/ton-data/">TON data</a> — on-chain analytics,
              Dune, research queries, product metrics and ways to turn raw
              blockchain data into a decision a team can use.
            </li>
            <li>
              <a href="/topics/telegram-automation/">Telegram automation</a> —
              mini apps, bots, content pipelines, channels and operational
              interfaces where Telegram becomes part of the work system.
            </li>
            <li>
              <a href="/topics/second-brain/">Second brain</a> — Obsidian,
              GBrain, project memory, raw notes and rules that keep decisions
              available after long agent sessions.
            </li>
          </ul>
        </section>

        <section className="home-section home-detail-section" aria-labelledby="home-route">
          <h2 id="home-route">How to Use the Site</h2>
          <p>
            If you arrive from search on a specific article, the best next step
            is usually to stay with that page language: Russian material lives
            in <a href="/ru/blog/">Blog</a> and
            <a href="/ru/articles/"> Articles</a>, English material lives in
            <a href="/en/blog/"> Blog</a> and
            <a href="/en/articles/"> Articles</a>. The RU/EN switcher keeps
            those addresses stable instead of hiding them behind a forced
            redirect, which is better for readers and search crawlers.
          </p>
          <p>
            I try to publish notes after real use rather than writing abstract
            tool roundups: what sped up the task, where the tool broke, which
            settings are worth copying and which conclusions should be saved in
            project memory. That is why the homepage highlights the newest
            pieces with images, while the full archive stays in the section
            pages.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
