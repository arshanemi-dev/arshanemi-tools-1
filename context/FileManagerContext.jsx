'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

const FileManagerContext = createContext(null)

export function FileManagerProvider({ children, initialPath = '' }) {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [items, setItems]             = useState({ folders: [], files: [] })
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [clipboard, setClipboard]     = useState(null) // { op: 'copy'|'cut', paths: [] }
  const [view, setView]               = useState('grid')
  const [sortBy, setSortBy]           = useState('name')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [toasts, setToasts]           = useState([])
  const refetchRef                    = useRef(null)

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const toggleSelect = useCallback((path, e) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    const allPaths = [
      ...items.folders.map(f => f.path),
      ...items.files.map(f => f.path),
    ]
    setSelectedItems(new Set(allPaths))
  }, [items])

  const clearSelection = useCallback(() => setSelectedItems(new Set()), [])

  const registerRefetch = useCallback((fn) => { refetchRef.current = fn }, [])

  const refetch = useCallback(() => {
    if (refetchRef.current) refetchRef.current()
  }, [])

  return (
    <FileManagerContext.Provider value={{
      currentPath, setCurrentPath,
      items, setItems,
      selectedItems, toggleSelect, selectAll, clearSelection,
      clipboard, setClipboard,
      view, setView,
      sortBy, setSortBy,
      loading, setLoading,
      error, setError,
      toasts, toast,
      refetch, registerRefetch,
    }}>
      {children}
    </FileManagerContext.Provider>
  )
}

export function useFileManager() {
  const ctx = useContext(FileManagerContext)
  if (!ctx) throw new Error('useFileManager must be used within FileManagerProvider')
  return ctx
}
