'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import './Login.css'

function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if already authenticated
    const token = localStorage.getItem('authToken')
    if (token) {
      router.push('/')
    }
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('') // Clear any previous errors

    // Check password
    if (password === "jioblackrock") {
      localStorage.setItem('authToken', 'user-token')
      router.push('/')
    } else {
      setError('Invalid password. Please try again.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (error) setError('') // Clear error when user starts typing
  }

  return (
    <div className="login-page">
      {/* Header with Logo */}
      <header className="login-header">
        <div className="logo-section">
          <img src="/assets/jio-logo.png" alt="Jio" className="jio-logo-img" />
        </div>
      </header>

      <div className="login-content">
        <div className="login-container">
          <div className="login-card">
            <div className="login-welcome">
              <h1 className="login-title">Welcome to the Demo JioBlackRock Learning Hub</h1>
              {/* <p className="login-subtitle">Please sign in to continue your learning journey</p> */}
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <button type="submit" className="login-button">
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
