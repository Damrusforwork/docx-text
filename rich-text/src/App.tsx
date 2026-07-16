import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ApproachWorkspace from './components/ApproachWorkspace'
import PageRendererWorkspace from './components/PageRendererWorkspace'
import { getLayoutApproach } from './layoutApproaches'
import './styles/editor.css'
import './styles/document.css'
import './styles/sidebar.css'
import './styles/approach.css'

function App() {
  const [activeNav, setActiveNav] = useState<string>('home')
  const activeApproach = getLayoutApproach(activeNav)

  return (
    <div className="app-layout">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />
      <main className="app-main">
        {activeApproach
          ? <ApproachWorkspace approach={activeApproach} />
          : <PageRendererWorkspace />}
      </main>
    </div>
  )
}

export default App
