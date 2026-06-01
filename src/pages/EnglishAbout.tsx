import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { ArrowRightUpIcon } from '../components/Icons'
import { openUrl } from '../openUrl'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

const experience = [
  {
    title: 'Head of Analytics',
    company: 'TON Foundation',
    period: 'Sep 2025 — now',
    location: 'London, Remote',
    description: 'Building analytics for TON Blockchain: Dune, on-chain research, analyst contests and practical data infrastructure.',
    link: 'https://dune.com/blockchains/ton',
    linkLabel: 'Dune Dashboard',
  },
  {
    title: 'Research Analyst',
    company: 'TON Foundation',
    period: 'Dec 2024 — Oct 2025',
    location: 'London, Remote',
    description: 'Making TON easier to analyze through tooling, research community work and ad-hoc ecosystem analysis.',
  },
  {
    title: 'Senior Data Scientist',
    company: 'Sequel',
    period: 'Jan — Nov 2024',
    location: 'London, On-site',
    description: 'Built Senna, a data platform for startup sourcing and outreach automation.',
    link: 'https://www.sequel.co/news/introducing-senna-our-proprietary-data-driven-platform',
    linkLabel: 'Read more',
  },
  {
    title: 'Co-Founder, CTO',
    company: 'Via Protocol',
    period: 'Aug 2021 — May 2023',
    location: 'London',
    description: 'On-chain liquidity aggregator. Raised about $2M and processed more than $1.5B/year in volume.',
    link: 'https://www.crunchbase.com/organization/via-exchange',
    linkLabel: 'Crunchbase',
  },
]

export function EnglishAbout() {
  useDocumentMeta({
    title: 'Daniil Okhlopkov — AI Agents, TON Analytics and Telegram',
    description: 'Daniil Okhlopkov leads analytics at TON Foundation and writes about AI agents, on-chain analytics, Telegram workflows, data products and startups.',
    canonical: absoluteUrl('/en/about/'),
    lang: 'en',
    alternates: {
      ru: absoluteUrl('/about/'),
      en: absoluteUrl('/en/about/'),
      'x-default': absoluteUrl('/about/'),
    },
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton to="/en/" />
        <h1 className="subpage-title">About</h1>
        <p className="subpage-subtitle">Data, crypto, AI agents. London.</p>
      </div>

      <div className="info-card">
        <p>
          I lead analytics at TON Foundation and write about practical AI-agent workflows, on-chain data, Telegram automation and the tools I actually use.
        </p>
        <p style={{ marginTop: 12 }}>
          Before TON I was a startup CTO, data scientist in VC, Entrepreneur First founder in residence and Forbes 30 Under 30 Russia.
        </p>
      </div>

      <div className="section-label">
        <span>Experience</span>
        <div className="section-label-line" />
      </div>

      {experience.map((role) => (
        <div key={`${role.company}-${role.period}`} className="experience-card">
          <div className="experience-header">
            <span className="experience-title">{role.title}</span>
            <span className="experience-company">{role.company}</span>
          </div>
          <div className="experience-meta">
            <span>{role.period}</span>
            <span>{role.location}</span>
          </div>
          <p className="experience-desc">{role.description}</p>
          {role.link && (
            <span
              className="experience-link"
              onClick={() => openUrl(role.link, 'about_en', role.linkLabel || role.company)}
              role="link"
            >
              {role.linkLabel} <ArrowRightUpIcon size={12} />
            </span>
          )}
        </div>
      ))}

      <div
        className="cta-btn"
        onClick={() => openUrl('https://www.linkedin.com/in/danokhlopkov/', 'about_en', 'linkedin')}
        role="link"
      >
        <span>Full profile on LinkedIn</span>
        <ArrowRightUpIcon size={20} />
      </div>

      <Footer />
    </div>
  )
}
