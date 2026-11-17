import { useEffect, useLayoutEffect, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'
import { createHeadingIdAssigner, sectionControlHtml, sectionLabels } from './articleSections.mts'
import { copyToClipboard } from './codeBlocks'

export function useArticleSectionLinks(
  articleRef: RefObject<HTMLElement | null>,
  path: string,
  lang: string,
  bodyHtml?: string,
) {
  const { hash } = useLocation()

  useLayoutEffect(() => {
    const article = articleRef.current
    if (!article) return
    const assignId = createHeadingIdAssigner([
      article.id,
      ...Array.from(article.querySelectorAll('[id]'), (element) => element.id),
    ])
    const controlHtml = sectionControlHtml(lang)
    const labels = sectionLabels(lang)
    const controls: Element[] = []
    const assignedIds: HTMLElement[] = []
    const timers = new Map<HTMLElement, number>()
    for (const heading of article.querySelectorAll<HTMLElement>('h2, h3')) {
      if (!heading.id) {
        heading.id = assignId(heading.innerHTML)
        assignedIds.push(heading)
      }
      heading.insertAdjacentHTML('beforeend', controlHtml)
      controls.push(heading.lastElementChild!)
    }

    async function copySectionLink(event: MouseEvent) {
      const button = event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>('.article-section-link')
        : null
      const heading = button?.closest<HTMLElement>('h2, h3')
      const status = button?.parentElement?.querySelector<HTMLElement>('.article-section-status')
      if (!heading || !status) return

      const url = new URL(path, window.location.origin)
      url.hash = encodeURIComponent(heading.id)
      try {
        await copyToClipboard(url.href)
        status.textContent = labels.copied
      } catch {
        status.textContent = labels.error
      }
      if (!status.isConnected) return
      window.clearTimeout(timers.get(status))
      timers.set(status, window.setTimeout(() => {
        status.textContent = ''
        timers.delete(status)
      }, 1600))
    }

    article.addEventListener('click', copySectionLink)
    return () => {
      article.removeEventListener('click', copySectionLink)
      timers.forEach((timer) => window.clearTimeout(timer))
      controls.forEach((control) => control.remove())
      assignedIds.forEach((heading) => heading.removeAttribute('id'))
    }
  }, [articleRef, path, lang, bodyHtml])

  // Run after the article has added its code block toolbars.
  useEffect(() => {
    if (!hash) return
    const fragment = hash.slice(1)
    let id = fragment
    try {
      id = decodeURIComponent(fragment)
    } catch {
      // Older articles can use literal percent signs in IDs.
    }
    const target = document.getElementById(id) || document.getElementById(fragment)
    if (target && articleRef.current?.contains(target)) target.scrollIntoView({ behavior: 'instant' })
  }, [articleRef, path, lang, hash, bodyHtml])
}
