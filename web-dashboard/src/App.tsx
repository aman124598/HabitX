import Experience from './components/Experience'
import { Analytics } from '@vercel/analytics/react'
import PrivacyPolicy from './components/PrivacyPolicy'
import { useState, useEffect } from 'react'

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  if (currentPath === '/privacy') {
    return <PrivacyPolicy />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000' }}>
      <Experience />
      <Analytics />
    </div>
  )
}

export default App
