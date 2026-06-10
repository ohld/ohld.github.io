import legacyRedirects from '../content/articles/legacy-redirects.json'
import topicHubConfig from '../content/topic-hubs.json'
import type { BlogListItem } from './blog'
import { englishArticleItems, englishBlogItems, russianArticleItems, russianBlogItems } from './blog'
import { getImportedArticles } from './importedArticles'

export interface TopicDefinition {
  slug: string
  label: string
  title: string
  description: string
  aliases: string[]
  articlePaths?: string[]
  featuredLinks?: Array<{
    href: string
    label: string
    description: string
  }>
}

interface TopicHubConfig {
  minItemsForIndex?: number
  homeTopicSlugs?: string[]
  hubs: TopicDefinition[]
}

type LegacyRedirect = { from: string; to: string }

const config = topicHubConfig as TopicHubConfig
const legacyRedirectFromPaths = new Set((legacyRedirects as LegacyRedirect[]).map((redirect) => canonicalPath(redirect.from)))

export const minTopicItemsForIndex = config.minItemsForIndex || 2
export const topicDefinitions: TopicDefinition[] = config.hubs.map((topic) => ({
  ...topic,
  aliases: topic.aliases || [],
  articlePaths: topic.articlePaths || [],
}))

function canonicalPath(pathname: string) {
  const pathOnly = pathname.split('?')[0].split('#')[0] || '/'
  if (pathOnly === '/') return '/'
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`
}

function listItemKey(pathname: string) {
  return canonicalPath(pathname)
}

function byNewest(a: BlogListItem, b: BlogListItem) {
  return b.publishedAt.localeCompare(a.publishedAt)
}

function importedArticleToListItem(article: ReturnType<typeof getImportedArticles>[number]): BlogListItem {
  return {
    path: article.path,
    title: article.title,
    description: article.description,
    publishedAt: article.publishedAt,
    readingTime: article.readingTime,
    tags: article.tags,
    thumbnail: article.heroImage,
  }
}

function uniqueItems(items: BlogListItem[]) {
  const byPath = new Map<string, BlogListItem>()
  for (const item of items) {
    const key = listItemKey(item.path)
    if (!byPath.has(key) && !legacyRedirectFromPaths.has(key)) byPath.set(key, item)
  }
  return [...byPath.values()]
}

export function getAllArticleItems() {
  return uniqueItems([
    ...russianBlogItems,
    ...englishBlogItems,
    ...russianArticleItems,
    ...englishArticleItems,
    ...getImportedArticles().map(importedArticleToListItem),
  ]).sort(byNewest)
}

function itemsByPath() {
  return new Map(getAllArticleItems().map((item) => [listItemKey(item.path), item]))
}

function configuredItemsForTopic(topic: TopicDefinition) {
  const byPath = itemsByPath()
  return (topic.articlePaths || [])
    .map((pathname) => byPath.get(listItemKey(pathname)))
    .filter((item): item is BlogListItem => Boolean(item))
}

function itemMatchesTopic(item: BlogListItem, topic: TopicDefinition) {
  const haystack = [
    item.title,
    item.description,
    ...item.tags,
  ].join(' ').toLowerCase()
  return topic.aliases.some((alias) => haystack.includes(alias.toLowerCase()))
}

export function getTopic(slug: string | undefined) {
  return topicDefinitions.find((topic) => topic.slug === slug)
}

export function getConfiguredTopicItems(slug: string | undefined) {
  const topic = getTopic(slug)
  return topic ? configuredItemsForTopic(topic) : []
}

export function isTopicIndexable(slug: string | undefined) {
  return getConfiguredTopicItems(slug).length >= minTopicItemsForIndex
}

export function getTopicItems(slug: string | undefined) {
  const topic = getTopic(slug)
  if (!topic) return []

  const configuredItems = configuredItemsForTopic(topic)
  if (configuredItems.length) return configuredItems

  return getAllArticleItems()
    .filter((item) => itemMatchesTopic(item, topic))
    .sort(byNewest)
}

export function getPrimaryTopicForItem(item: BlogListItem) {
  const itemPath = listItemKey(item.path)
  const configuredTopic = topicDefinitions.find((topic) =>
    (topic.articlePaths || []).some((pathname) => listItemKey(pathname) === itemPath),
  )
  if (configuredTopic) return configuredTopic
  return topicDefinitions.find((topic) => itemMatchesTopic(item, topic)) || null
}

const homeTopicSlugs = config.homeTopicSlugs || []
export const homeTopics = topicDefinitions.filter((topic) => homeTopicSlugs.includes(topic.slug))

export function topicPath(slug: string) {
  return `/topics/${slug}/`
}

export function slugifyTopicTag(tag: string) {
  const normalized = tag.trim().toLowerCase()
  return topicDefinitions.find((topic) => topic.aliases.includes(normalized) || topic.label.toLowerCase() === normalized)?.slug
    || normalized
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-+|-+$/g, '')
}
