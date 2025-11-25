import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const useAuth = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const isWebview = searchParams.get('webview') === 'true'

    // If webview=true is present, token will be set by the component
    // If not webview and no token, redirect to login
    if (!isWebview && !token) {
      router.push('/login')
    }
  }, [router, searchParams])

  const isAuthenticated = () => {
    return !!localStorage.getItem('authToken')
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  return { isAuthenticated, logout }
}