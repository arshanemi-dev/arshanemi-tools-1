'use client'

import { useState, useEffect } from 'react'
import Header from './Header'
import FloatingShortcuts from './FloatingShortcuts'
import LoginScreen from './LoginScreen'
import { isLoggedIn, getStoredUser } from '@/lib/tokenStore'

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'

export default function AppShell({ children }) {
  const [authed,   setAuthed]   = useState(!IS_CONNECT)
  const [authUser, setAuthUser] = useState(null)
  const [checked,  setChecked]  = useState(!IS_CONNECT)

  useEffect(() => {
    if (IS_CONNECT) {
      const loggedIn = isLoggedIn()
      const user     = getStoredUser()
      setAuthed(loggedIn)
      setAuthUser(user)
      setChecked(true)
    }
  }, [])

  if (!checked) return null

  if (!authed) {
    return (
      <div className="h-full flex flex-col">
        <LoginScreen
          onLogin={(user) => {
            setAuthUser(user)
            setAuthed(true)
          }}
        />
      </div>
    )
  }

  return (
    <>
      {/* Header: visible only when IS_CONNECT=false (local mode) */}
      {!IS_CONNECT && <Header authUser={authUser} />}

      <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--lt-bg-base)' }}>
        {children}
      </main>

      {/* Floating shortcuts: visible only when IS_CONNECT=true (no top nav) */}
      {IS_CONNECT && <FloatingShortcuts />}
    </>
  )
}
