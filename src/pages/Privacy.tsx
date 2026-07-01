import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function Privacy() {
  useDocumentMeta({
    title: 'Privacy Policy — okhlopkov.com',
    description: 'Privacy policy for okhlopkov.com and the personal Pinterest Content Ideas integration.',
    canonical: absoluteUrl('/privacy/'),
    lang: 'en',
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">Privacy Policy</h1>
        <p className="subpage-subtitle">Effective date: May 25, 2026</p>
      </div>

      <div className="info-card">
        <p>
          This policy explains how okhlopkov.com and the personal Pinterest Content Ideas
          integration handle data. The integration is intended for personal use by Daniil
          Okhlopkov to read his own Pinterest boards and pins for private visual reference
          workflows.
        </p>
      </div>

      <div className="section-label">
        <span>Data Access</span>
        <div className="section-label-line" />
      </div>

      <div className="info-card">
        <p>
          If Pinterest authorization is used, the integration may read Pinterest account
          identifiers, boards, pins, pin metadata, descriptions, links, and image URLs that
          are available to the authorized Pinterest account.
        </p>
        <p style={{ marginTop: 12 }}>
          The integration does not request permissions to create, update, or delete
          Pinterest content.
        </p>
      </div>

      <div className="section-label">
        <span>Use</span>
        <div className="section-label-line" />
      </div>

      <div className="info-card">
        <p>
          Pinterest data is used to maintain a private visual moodboard, create local
          reference manifests, and select inspiration for newly generated article visuals.
          Source Pinterest images are treated as references, not as public assets for
          redistribution.
        </p>
      </div>

      <div className="section-label">
        <span>Storage</span>
        <div className="section-label-line" />
      </div>

      <div className="info-card">
        <p>
          Reference data may be stored locally or in private systems controlled by Daniil
          Okhlopkov. Raw Pinterest references, access tokens, and private manifests are not
          intentionally published in the public okhlopkov.com repository.
        </p>
      </div>

      <div className="section-label">
        <span>Sharing</span>
        <div className="section-label-line" />
      </div>

      <div className="info-card">
        <p>
          Pinterest data is not sold or shared with third parties. Final generated visuals
          and articles may be published on okhlopkov.com, but they are created as new
          content and reviewed before publication.
        </p>
      </div>

      <div className="section-label">
        <span>Contact</span>
        <div className="section-label-line" />
      </div>

      <div className="info-card">
        <p>
          Questions about this policy can be sent via Telegram at <a href="https://t.me/+klIZiMe4w30zZTgy" target="_blank" rel="noopener noreferrer">@danokhlopkov</a> or through
          the public contact links on okhlopkov.com.
        </p>
      </div>

      <Footer />
    </div>
  )
}
