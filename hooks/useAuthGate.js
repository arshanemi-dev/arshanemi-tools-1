'use client'

import { useState, useEffect, useRef } from 'react'
import { isLoggedIn, getStoredUser } from '@/lib/tokenStore'
import { getActiveUser } from '@/lib/localStore'
import { getUserRootPath, ensureUserFolderFromClient } from '@/lib/userAccess'

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
        user = getActiveUser()
        if (!user)        { setChecked(true); setAuthed(false); return }
      }

      // Determine root path
      let root = ''
      if (user?.role !== 'admin') {
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
