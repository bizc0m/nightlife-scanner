import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Map from './pages/Map'
import EstablishmentDetail from './pages/EstablishmentDetail'
import ContributorDashboard from './pages/Contributor/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

interface User {
  id: string
  email: string
  username: string
  role: 'contributor' | 'validator' | 'admin'
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
        }
      }
    }
  }, [token])

  const handleLogin = (user: User, token: string) => {
    setUser(user)
    setToken(token)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onRegister={handleLogin} />} />
        <Route path="/" element={<Map user={user} onLogout={handleLogout} />} />
        <Route path="/establishment/:id" element={<EstablishmentDetail user={user} />} />
        {token && (
          <Route path="/contributor" element={<ContributorDashboard user={user} token={token} />} />
        )}
      </Routes>
    </Router>
  )
}

export default App
