'use client'

import '@/lib/tokenHandoff' // side effect only — must run before the isLoggedIn() check below

import { useState, useEffect, useRef } from 'react'
import { isLoggedIn, getStoredUser } from '@/lib/tokenStore'
import { getUsers, getActiveUser } from '@/lib/dataStore'
import { buildUserRootPath, getUserRootPath, ensureUserFolderFromClient } from '@/lib/userAccess'

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT?.toLowerCase() === 'true'

export function useAuthGate(initialPath = '') {
  const [checked,  setChecked]  = useState(false)
  const [authed,   setAuthed]   = useState(false)
  const [userRoot, setUserRoot] = useState('')
  const [startPath, setStartPath] = useState(initialPath)

  const runRef = useRef(null)

  useEffect(() => {
    async function run() {
      let user = null

      if (IS_CONNECT) {
        if (!isLoggedIn()) { setChecked(true); setAuthed(false); return }
        user = getStoredUser()
      } else {
        const users = await getUsers()
        user = getActiveUser(users)
        if (!user)        { setChecked(true); setAuthed(false); return }
      }

      // Determine root path
      let root = ''
      if (user?.role === 'admin') {
        root = await buildUserRootPath(user)
      } else {
        root = getUserRootPath()
        if (!root) root = await ensureUserFolderFromClient(user)
      }

      setUserRoot(root)

      // Deep-link inside user's folder is fine; outside → snap to root
      if (root && initialPath && initialPath.startsWith(root)) {
        setStartPath(initialPath)
      } else {
        setStartPath(root || initialPath)
      }

      setAuthed(true)
      setChecked(true)
    }

    runRef.current = run
    run()

    const onSuccess = () => runRef.current?.()
    window.addEventListener('auth:success', onSuccess)
    return () => window.removeEventListener('auth:success', onSuccess)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { checked, authed, userRoot, startPath }
}
