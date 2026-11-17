import { articleEndingHtml } from '../articleEnding.mts'

export function ArticleEnding({ path }: { path: string }) {
  const html = articleEndingHtml(path)
  return html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : null
}
