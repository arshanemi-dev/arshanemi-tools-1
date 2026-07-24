'use client'
// Cross-app SSO handoff — receiving half. See the admin panel repo's
// components/tools/ToolUseClient.jsx for the sending half: when this app is
// opened inside the admin panel's iframe, the admin panel appends its own
// session tokens as query params on the iframe src (it can't write to this
// origin's localStorage directly — different origin).
//
// This runs at MODULE-EVALUATION time, not inside a React effect — plain
// top-level code in an ES module runs once, synchronously, the first time
// the module is imported, which happens before any component in the same
// bundle chunk gets to render. Importing this file (for its side effect
// only) at the top of AppShell.jsx and useAuthGate.js guarantees the tokens
// are already in localStorage before either one's mount-time isLoggedIn()
// check runs — i.e. "assign local storage, then load the website."
import { saveAuthTokens } from './tokenStore'

if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  const accessToken = params.get('lt_at')
  const refreshToken = params.get('lt_rt')

  if (accessToken && refreshToken) {
    let user = null
    const rawUser = params.get('lt_u')
    if (rawUser) {
      try { user = JSON.parse(rawUser) } catch { /* malformed payload — proceed without a cached user */ }
    }

    saveAuthTokens({ accessToken, refreshToken, expiresIn: 86400, user })

    // Strip the handoff params so the tokens never linger in browser
    // history or get reprocessed on a refresh/back-navigation.
    params.delete('lt_at')
    params.delete('lt_rt')
    params.delete('lt_u')
    const query = params.toString()
    const nextUrl = window.location.pathname + (query ? `?${query}` : '') + window.location.hash
    window.history.replaceState({}, '', nextUrl)
  }
}
