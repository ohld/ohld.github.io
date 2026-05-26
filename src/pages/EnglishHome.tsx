import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { trackNav } from '../analytics'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'
import { englishArticleItems, englishBlogItems } from '../blog'

const navItems = [
  { path: '/en/blog', title: 'Blog', subtitle: 'Notes and working ideas', items: englishBlogItems.slice(0, 3) },
  { path: '/en/articles', title: 'Articles', subtitle: 'Tutorials, comparisons and explainers', items: englishArticleItems.slice(0, 2) },
  { path: '/en/about', title: 'About', subtitle: 'Background, work and links' },
]

export function EnglishHome() {
  const navigate = useNavigate()
  useDocumentMeta({
    title: 'Daniil Okhlopkov — AI agents, data, TON and Telegram',
    description: 'Practical notes on AI agents, Codex, Claude Code, MCP, TON analytics and Telegram automation by Daniil Okhlopkov.',
    canonical: absoluteUrl('/en/'),
    lang: 'en',
    alternates: {
      ru: absoluteUrl('/'),
      en: absoluteUrl('/en/'),
      'x-default': absoluteUrl('/'),
    },
  })

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header-name">Daniil<br />Okhlopkov</h1>
        <div className="page-header-handle">
          <span className="page-header-dot" />
          <span className="page-header-mono">@danokhlopkov</span>
        </div>
        <p className="page-header-bio">
          Head of Analytics @ TON Foundation.<br />I write about AI agents, data, crypto and Telegram.
        </p>
      </header>

      <main className="home-sections" aria-label="Main sections">
        {navItems.map((item) => (
          <section className="home-route-panel" key={item.path}>
            <button
              type="button"
              className="nav-row"
              onClick={() => { trackNav(item.path); navigate(item.path) }}
            >
              <div className="nav-row-content">
                <span className="nav-row-title">{item.title}</span>
                <span className="nav-row-subtitle">{item.subtitle}</span>
              </div>
              <div className="nav-row-right" />
            </button>
            {item.items && (
              <div className="home-card-list">
                {item.items.map((entry) => (
                  <a className="home-list-link" href={entry.path} key={entry.path}>
                    <span>{entry.title}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        ))}
      </main>

      <section className="home-section home-detail-section" aria-labelledby="home-start">
        <h2 id="home-start">If you are setting up AI agents</h2>
        <p>
          Start with <a href="/claude-code-setup-mcp-hooks-skills-2026/">my Claude Code setup</a>:
          MCP servers, hooks, skills, subagents and project rules that survived
          months of daily work. If the agent starts losing context, read the
          <a href="/claude-code-compaction-kak-rabotaet/">Claude Code compaction notes</a>.
          If you need to choose between Codex and Claude Code, use the
          <a href="/blog/claude-code-vs-codex-perehod/">Codex migration write-up</a>.
        </p>
        <p>
          The working split is simple: <code>AGENTS.md</code> or <code>CLAUDE.md</code>
          stores project invariants, skills store repeatable procedures, MCP
          connects live data and tools, hooks catch risky actions, and subagents
          isolate research or review from the main editing context.
        </p>
      </section>

      <section className="home-section home-detail-section" aria-labelledby="home-practical">
        <h2 id="home-practical">Practical entry points</h2>
        <ul className="home-detail-list">
          <li><a href="/web-scraping-ai-agents-2026/">Web scraping AI agents</a> — when a browser agent beats an old parser.</li>
          <li><a href="/vtoroj-mozg-ai-assistent-obsidian-claude-code/">Second brain + Obsidian</a> — how to store raw notes, decisions and project memory.</li>
          <li><a href="/luchshie-skills-mcp-claude-code-agent-browser/">Claude Code skills and MCP</a> — what to install, and what not to over-engineer.</li>
          <li><a href="/articles/ai-tools-for-designers-design-engineering-agents/">AI tools for designers</a> — design engineering without generic UI-slop.</li>
          <li><a href="/blog/gstack-goal-office-hours-ai-workflow/">GStack, goal and office hours</a> — how to keep a long agent task moving until it ships.</li>
        </ul>
      </section>

      <section className="home-section home-detail-section" aria-labelledby="home-map">
        <h2 id="home-map">Agent terms without marketing</h2>
        <ul className="home-detail-list">
          <li><strong>Project rules</strong> — repository invariants: style, safety limits, validation commands and data locations.</li>
          <li><strong>Skills</strong> — repeatable procedures such as audit, ship, review, scrape and deploy.</li>
          <li><strong>MCP</strong> — live tool access: browser, GBrain, GitHub, analytics, documents and external APIs.</li>
          <li><strong>Hooks</strong> — automatic checks before risky commands, leaked secrets or accidental deploys.</li>
          <li><strong>Subagents</strong> — isolated context for research, QA and independent review.</li>
        </ul>
      </section>

      <section className="home-section home-detail-section" aria-labelledby="home-tool-choice">
        <h2 id="home-tool-choice">When I use each tool</h2>
        <p>
          Codex is useful when I need to move through a repository, make scoped
          edits, inspect the diff and ship the change. Claude Code is still
          strong for quick research sessions, long context and MCP experiments.
          GStack is the operational layer around the work: browser smoke, goal,
          QA, review, deploy and memory across long tasks.
        </p>
      </section>

      <section className="home-section home-detail-section" aria-labelledby="home-use-cases">
        <h2 id="home-use-cases">Where agents actually help</h2>
        <ul className="home-detail-list">
          <li>Reviewing large diffs: finding risk, checking boundaries and getting a second pass.</li>
          <li>Migrations: old URLs, sitemaps, redirects, canonicals and smoke tests without a manual checklist.</li>
          <li>Tool research: gather sources, compare limits and leave a reproducible conclusion.</li>
          <li>Data work: draft a query, inspect strange rows and turn the output into a decision.</li>
          <li>Personal systems: Obsidian, GBrain and project notes where the agent remembers decisions.</li>
        </ul>
      </section>

      <section className="home-section home-detail-section" aria-labelledby="home-stack">
        <h2 id="home-stack">Minimal stack</h2>
        <ul className="home-detail-list">
          <li>One clear instruction file in the repository: rules, validation commands and task boundaries.</li>
          <li>Browser smoke tests for important screens, especially after navigation and static page changes.</li>
          <li>Memory in GBrain or Obsidian: decisions, mistakes, source links and the next step.</li>
          <li>A separate review before merge: fresh context often catches what the main agent missed.</li>
        </ul>
      </section>

      <section className="home-section home-detail-section" aria-labelledby="home-checklist">
        <h2 id="home-checklist">My checklist before trusting an agent</h2>
        <ul className="home-detail-list">
          <li>Give the agent real project files, not a hand-written architecture summary.</li>
          <li>Separate the task: research first, edits second, review after the diff exists.</li>
          <li>Run build, typecheck, smoke tests and mobile viewport checks before deploy.</li>
          <li>Check that the agent did not touch unrelated changes or expose credentials.</li>
          <li>Save durable lessons to GBrain or Obsidian when the pattern will repeat.</li>
        </ul>
        <p>
          These are working patterns for engineering, analytics, Telegram
          automation, design engineering and on-chain data. The useful test is
          simple: can the same approach survive a real project without magic or
          blind trust in the model?
        </p>
      </section>

      <Footer />
    </div>
  )
}
