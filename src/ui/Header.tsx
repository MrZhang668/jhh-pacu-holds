import { PROJECT, PROJECT_ZH } from '../content/overview'
import { navigate } from '../router'
import { useL } from '../state/lang'

export function Header() {
  const project = useL(PROJECT, PROJECT_ZH)
  return (
    <header className="site-header glass">
      <p className="org">{project.org}</p>
      <h1>
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault()
            navigate('')
          }}
        >
          {project.title}
        </a>
      </h1>
    </header>
  )
}
