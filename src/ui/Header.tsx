import { MODULE_ORDER, MODULES } from '../content/modules'
import { PROJECT } from '../content/overview'
import { navigate, type Route } from '../router'

export function Header({ route }: { route: Route }) {
  const current = route.name === 'module' ? route.key : route.name
  const item = (path: string, label: string, active: boolean) => (
    <li key={path || 'map'}>
      <a
        href={`#/${path}`}
        aria-current={active ? 'page' : undefined}
        onClick={(e) => {
          e.preventDefault()
          navigate(path)
        }}
      >
        {label}
      </a>
    </li>
  )
  return (
    <header className="site-header glass">
      <p className="eyebrow">JHU MSEM · Team 6</p>
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
      <p className="sub">The Johns Hopkins Hospital · Zayed &amp; Weinberg</p>
      <nav aria-label="Sections">
        <ul>
          {item('', 'Map', current === 'map')}
          {MODULE_ORDER.map((k) => item(k, MODULES[k].label, current === k))}
          {item('about', 'About', current === 'about')}
        </ul>
      </nav>
    </header>
  )
}
