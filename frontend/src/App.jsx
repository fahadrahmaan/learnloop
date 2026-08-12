import { useState, useEffect } from 'react'
import Register from './components/Register'
import Login from './components/Login'
import Habits from './components/Habits'
import StudySessions from './components/StudySessions'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [authState, setAuthState] = useState('login') // 'login', 'register'
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('habits') // 'habits', 'sessions'

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/me/')
      const data = await response.json()
      
      if (data.authenticated) {
        setIsAuthenticated(true)
        setUser(data.user)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1]
        }
      })
      setIsAuthenticated(false)
      setUser(null)
      setAuthState('login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return <div className="loading-container">Loading...</div>
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>LearnLoop</h1>
        {isAuthenticated && (
          <div className="header-actions">
            <span className="user-email">{user?.email}</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
        )}
      </header>
      
      <main className="app-main">
        {isAuthenticated ? (
          <div className="dashboard-container">
            <div className="tabs">
              <button 
                className={`tab-button ${activeTab === 'habits' ? 'active' : ''}`}
                onClick={() => setActiveTab('habits')}
              >
                Habits
              </button>
              <button 
                className={`tab-button ${activeTab === 'sessions' ? 'active' : ''}`}
                onClick={() => setActiveTab('sessions')}
              >
                Study Sessions
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'habits' ? <Habits /> : <StudySessions />}
            </div>
          </div>
        ) : (
          <div className="auth-wrapper">
            {authState === 'login' ? (
              <Login setAuthState={setAuthState} onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Register setAuthState={setAuthState} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
