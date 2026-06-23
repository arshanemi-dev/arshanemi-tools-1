'use client'

import { useState, useCallback, useRef } from 'react'

export function useSelection(allItems = []) {
  const [selectedItems, setSelectedItems] = useState(new Set())
  const lastClickedRef = useRef(null)

  const toggleSelect = useCallback((path, e) => {
    setSelectedItems(prev => {
      const next = new Set(prev)

      if (e?.shiftKey && lastClickedRef.current) {
        const allPaths = allItems.map(i => i.path)
        const fromIdx  = allPaths.indexOf(lastClickedRef.current)
        const toIdx    = allPaths.indexOf(path)
        if (fromIdx !== -1 && toIdx !== -1) {
          const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx]
          allPaths.slice(start, end + 1).forEach(p => next.add(p))
          return next
        }
      }

      if (e?.ctrlKey || e?.metaKey) {
        if (next.has(path)) next.delete(path)
        else next.add(path)
      } else {
        next.clear()
        next.add(path)
      }

      lastClickedRef.current = path
      return next
    })
  }, [allItems])

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(allItems.map(i => i.path)))
  }, [allItems])

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
    lastClickedRef.current = null
  }, [])

  return { selectedItems, toggleSelect, selectAll, clearSelection, setSelectedItems }
}
