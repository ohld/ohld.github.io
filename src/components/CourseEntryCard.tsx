import { useNavigate } from 'react-router-dom'
import { openUrl } from '../openUrl'

interface CourseEntryCardProps {
  quote: string
  context?: string
  link: string
  /** If true, `link` is an internal route — navigate via React Router instead of opening externally */
  internal?: boolean
}

export function CourseEntryCard({ quote, context, link, internal }: CourseEntryCardProps) {
  const navigate = useNavigate()
  const handleClick = () => {
    if (internal) {
      navigate(link)
    } else {
      openUrl(link, 'course', quote)
    }
  }
  return (
    <div className="course-entry" onClick={handleClick} role="link">
      <p className="course-entry-quote">{quote}</p>
      {context && <p className="course-entry-context">{context}</p>}
    </div>
  )
}
