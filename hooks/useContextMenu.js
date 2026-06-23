'use client'

import { useState, useCallback, useEffect } from 'react'

export function useContextMenu() {
  const [menu, setMenu] = useState(null) // { x, y, item }

  const openMenu = useCallback((e, item) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, item })
  }, [])

  const closeMenu = useCallback(() => setMenu(null), [])

  useEffect(() => {
    if (!menu) return
    const handle = () => closeMenu()
    window.addEventListener('click', handle)
    window.addEventListener('keydown', handle)
    return () => {
      window.removeEventListener('click', handle)
      window.removeEventListener('keydown', handle)
    }
  }, [menu, closeMenu])

  return { menu, openMenu, closeMenu }
}
