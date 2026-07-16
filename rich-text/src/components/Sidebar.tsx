import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Files,
  Home,
  Layers3,
  type LucideIcon,
} from 'lucide-react'
import { layoutApproaches } from '../layoutApproaches'

interface SubMenuItem {
  label: string
  id: string
  number: number
}

interface MenuItem {
  icon: LucideIcon
  label: string
  id: string
  children?: SubMenuItem[]
  divider?: never
}

interface DividerItem {
  divider: true
  icon?: never
  label?: never
  id?: never
}

type MenuEntry = MenuItem | DividerItem

const menuItems: MenuEntry[] = [
  { icon: Home, label: 'Home', id: 'home' },
  { icon: Files, label: 'Phase 4 · A4 Page Renderer', id: 'phase-4-page-renderer' },
  {
    icon: Layers3,
    label: 'Layout Approaches',
    id: 'layout-approaches',
    children: layoutApproaches.map(({ id, label, number }) => ({ id, label, number })),
  },
]

interface SidebarProps {
  activeItem: string
  onNavigate: (id: string) => void
}

export default function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['layout-approaches'])

  useEffect(() => {
    if (activeItem.startsWith('approach-')) {
      setExpandedMenus((items) => items.includes('layout-approaches') ? items : [...items, 'layout-approaches'])
    }
  }, [activeItem])

  const toggleMenu = (id: string) => {
    setExpandedMenus((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  }

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
        {menuItems.map((item, index) =>
          'divider' in item && item.divider ? (
            <li key={index} className="sidebar-divider" />
          ) : (() => {
            const menuItem = item as MenuItem
            const Icon = menuItem.icon
            const hasChildren = Boolean(menuItem.children?.length)
            const expanded = expandedMenus.includes(menuItem.id)
            const childActive = menuItem.children?.some((child) => child.id === activeItem)
            return (
            <li key={menuItem.id} className={hasChildren ? 'sidebar-menu-group' : undefined}>
              <button
                className={`sidebar-item ${activeItem === menuItem.id || childActive ? 'active' : ''}`}
                onClick={() => hasChildren ? toggleMenu(menuItem.id) : onNavigate(menuItem.id)}
                title={collapsed ? menuItem.label : undefined}
                aria-expanded={hasChildren ? expanded : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span>{menuItem.label}</span>}
                {!collapsed && hasChildren && (expanded ? <ChevronDown className="submenu-chevron" size={15} /> : <ChevronRight className="submenu-chevron" size={15} />)}
              </button>
              {!collapsed && hasChildren && expanded && (
                <ul className="sidebar-submenu">
                  {menuItem.children?.map((child) => (
                    <li key={child.id}>
                      <button type="button" className={activeItem === child.id ? 'active' : ''} onClick={() => onNavigate(child.id)}>
                        <span className="submenu-number">{String(child.number).padStart(2, '0')}</span>
                        <span>{child.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            )
          })()
        )}
      </ul>
    </nav>
  )
}
