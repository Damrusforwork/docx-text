import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import './styles/editor.css'
import './styles/document.css'
import './styles/sidebar.css'

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Editor />
      </main>
    </div>
  )
}

export default App
