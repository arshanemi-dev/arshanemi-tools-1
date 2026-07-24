'use client'

import '@/lib/tokenHandoff' // side effect only — must run before the isLoggedIn() check below

import { useState, useEffect } from 'react'
import Header from './Header'
import FloatingShortcuts from './FloatingShortcuts'
import LoginScreen from './LoginScreen'
import { isLoggedIn, getStoredUser, fetchProfile } from '@/lib/tokenStore'
import { getUsers, getActiveUser } from '@/lib/dataStore'

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'
// Opt-out (not opt-in) so an unset env var keeps today's behavior — the
// widget already shipped visible in connected mode before this flag existed.
const SHOW_FLOATING_MENU = process.env.NEXT_PUBLIC_SHOW_FLOATING_MENU !== 'false'
// "true" forces the in-app Header off regardless of IS_CONNECT — for when
// this app is embedded in an iframe (e.g. the admin panel's ToolUseClient)
// and its own header would just duplicate the host page's chrome. Any other
// value (including unset) keeps the existing IS_CONNECT-based behavior.
const HEADER_HIDDEN = process.env.NEXT_PUBLIC_IS_HEADER_HIDE === 'true'

export default function AppShell({ children }) {
  const [authed,   setAuthed]   = useState(!IS_CONNECT)
  const [authUser, setAuthUser] = useState(null)
  const [checked,  setChecked]  = useState(!IS_CONNECT)

  useEffect(() => {
    let cancelled = false

    if (IS_CONNECT) {
      const loggedIn = isLoggedIn()
      setAuthed(loggedIn)
      setChecked(true)
      if (loggedIn) {
        setAuthUser(getStoredUser()) // instant paint from the login-time cache
        fetchProfile().then(fresh => {
          if (!cancelled && fresh) setAuthUser(fresh) // then replace with the live profile
        })
      }
    } else {
      // Local mode: no admin-panel session — the "current user" is whichever
      // local profile is marked active in data/users.json.
      getUsers()
        .then(users => { if (!cancelled) setAuthUser(getActiveUser(users)) })
        .catch(() => {})
    }

    return () => { cancelled = true }
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
      {/* Header: visible only when IS_CONNECT=false (local mode) and not hidden via NEXT_PUBLIC_IS_HEADER_HIDE=true */}
      {!IS_CONNECT && !HEADER_HIDDEN && <Header authUser={authUser} />}

      <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--lt-bg-base)' }}>
        {children}
      </main>

      {/* Floating shortcuts: visible only when IS_CONNECT=true (no top nav),
          and only when not explicitly hidden via NEXT_PUBLIC_SHOW_FLOATING_MENU */}
      {IS_CONNECT && SHOW_FLOATING_MENU && <FloatingShortcuts />}
    </>
  )
}
