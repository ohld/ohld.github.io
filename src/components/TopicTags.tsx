import { topicPath, slugifyTopicTag } from '../topics'

export function TopicTags({ tags, label = 'Теги' }: { tags: string[], label?: string }) {
  return (
    <div className="blog-card-tags" aria-label={label}>
      {tags.map((tag) => (
        <a key={tag} href={topicPath(slugifyTopicTag(tag))}>{tag}</a>
      ))}
    </div>
  )
}
