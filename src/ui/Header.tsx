import { PROJECT } from '../content/overview'
import { navigate } from '../router'

export function Header() {
  return (
    <header className="site-header glass">
      <h1>
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault()
            navigate('')
          }}
        >
          {PROJECT.title}
        </a>
      </h1>
    </header>
  )
}
