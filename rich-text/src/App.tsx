import { useState } from 'react'
import Sidebar from './components/Sidebar'
import PageRendererWorkspace from './components/PageRendererWorkspace'
import './styles/editor.css'
import './styles/document.css'
import './styles/sidebar.css'
import './styles/approach.css'

function App() {
  const [activeNav, setActiveNav] = useState<string>('home')

  return (
    <div className="app-layout">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />
      <main className="app-main">
        <PageRendererWorkspace />
      </main>
    </div>
  )
}

export default App
