import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function Privacy() {
  useDocumentMeta({
    title: 'Privacy Policy — okhlopkov.com',
    description: 'Privacy policy for okhlopkov.com, including traffic analytics and external links.',
    canonical: absoluteUrl('/privacy/'),
    lang: 'en',
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">Privacy Policy</h1>
        <p className="subpage-subtitle">Effective date: July 20, 2026</p>
      </div>

      <div className="info-card">
        <p>
          okhlopkov.com is a personal publishing website. It does not offer user accounts or
          forms, and it does not ask visitors to submit personal information.
        </p>
      </div>

      <div className="section-label">
        <span>Analytics</span>
        <div className="section-label-line" />
      </div>

      <div className="info-card">
        <p>
          To understand traffic and improve the site, okhlopkov.com uses{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
            Google Analytics
          </a>
          ,{' '}
          <a href="https://yandex.com/legal/confidential/" target="_blank" rel="noreferrer">
            Yandex Metrica
          </a>
          , and{' '}
          <a
            href="https://help.ahrefs.com/en/articles/10247870-about-ahrefs-web-analytics"
            target="_blank"
            rel="noreferrer"
          >
            Ahrefs Web Analytics
          </a>
          . These services may receive technical and usage data such as browser and device
          information, approximate location, pages visited, and referral source. Some
          providers may use cookies or similar technologies under their own privacy policies.
        </p>
      </div>

      <div className="section-label">
        <span>Use of Data</span>
        <div className="section-label-line" />
      </div>

      <div className="info-card">
        <p>
          Analytics data is used to understand site traffic, diagnose problems, and improve
          content. Personal data is not sold.
        </p>
      </div>

      <div className="section-label">
        <span>External Links</span>
        <div className="section-label-line" />
      </div>

      <div className="info-card">
        <p>
          This site links to other websites and services. Their own privacy policies apply
          when you visit them.
        </p>
      </div>

      <div className="section-label">
        <span>Contact</span>
        <div className="section-label-line" />
      </div>

      <div className="info-card">
        <p>
          Questions about this policy can be sent via Telegram at{' '}
          <a
            href="https://t.me/+klIZiMe4w30zZTgy"
            target="_blank"
            rel="noopener noreferrer"
          >
            @danokhlopkov
          </a>
          .
        </p>
      </div>

      <Footer />
    </div>
  )
}
