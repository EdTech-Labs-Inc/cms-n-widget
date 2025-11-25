import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-primary">
      <div className="card p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Authentication Error</h1>
        <p className="text-text-secondary mb-6">
          Sorry, we couldn't complete your login. The authentication code is invalid or has expired.
        </p>
        <Link href="/login" className="btn btn-primary">
          Try Again
        </Link>
      </div>
    </div>
  )
}
