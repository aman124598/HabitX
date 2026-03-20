import Experience from './components/Experience'
import { Analytics } from '@vercel/analytics/react'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000' }}>
      <Experience />
      <Analytics />
    </div>
  )
}

export default App
