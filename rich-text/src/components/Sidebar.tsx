import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Files,
  Home,
  type LucideIcon,
} from 'lucide-react'

interface MenuItem {
  icon: LucideIcon
  label: string
  id: string
}

const menuItems: MenuItem[] = [
  { icon: Home, label: 'Home', id: 'home' },
  // { icon: Files, label: 'Phase 4 · A4 Page Renderer', id: 'phase-4-page-renderer' },
]

interface SidebarProps {
  activeItem: string
  onNavigate: (id: string) => void
}

export default function Sidebar({ activeItem, onNavigate }: SidebarProps) {
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
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.id}>
              <button
                className={`sidebar-item ${activeItem === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
