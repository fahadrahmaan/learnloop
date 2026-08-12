import { useState, useEffect } from 'react'
import Register from './components/Register'
import Login from './components/Login'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [authState, setAuthState] = useState('login') // 'login', 'register'
  const [loading, setLoading] = useState(true)

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
          <button onClick={handleLogout} className="logout-button">Logout</button>
        )}
      </header>
      
      <main className="app-main">
        {isAuthenticated ? (
          <div className="dashboard-placeholder">
            <h2>Welcome, {user?.email}!</h2>
            <p>You are successfully logged in.</p>
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
