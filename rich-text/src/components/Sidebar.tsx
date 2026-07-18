import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(false)

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        {!collapsed && <span className="brand-text">Doc Editor</span>}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <ul className="sidebar-menu">
        <li>
          <div className="sidebar-item active" title={collapsed ? 'Home' : undefined} aria-current="page">
            <Home size={20} />
            {!collapsed && <span>Home</span>}
          </div>
        </li>
      </ul>
    </nav>
  )
}
