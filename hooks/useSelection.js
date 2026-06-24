'use client'

import { useState, useCallback, useRef } from 'react'

export function useSelection(allItems = []) {
  // Map<path, selectionIndex> — 1-based, reflects insertion order
  const [selectionOrder, setSelectionOrder] = useState(new Map())
  const lastClickedRef = useRef(null)

  const selectedItems = new Set(selectionOrder.keys())

  const toggleSelect = useCallback((path, e) => {
    setSelectionOrder(prev => {
      const next = new Map(prev)

      if (e?.shiftKey && lastClickedRef.current) {
        const allPaths = allItems.map(i => i.path)
        const fromIdx  = allPaths.indexOf(lastClickedRef.current)
        const toIdx    = allPaths.indexOf(path)
        if (fromIdx !== -1 && toIdx !== -1) {
          const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx]
          let maxOrd = next.size > 0 ? Math.max(...next.values()) : 0
          allPaths.slice(start, end + 1).forEach(p => {
            if (!next.has(p)) next.set(p, ++maxOrd)
          })
          return next
        }
      }

      if (e?.ctrlKey || e?.metaKey) {
        if (next.has(path)) {
          next.delete(path)
          // Compact: renumber remaining in existing order
          const sorted = [...next.entries()].sort((a, b) => a[1] - b[1])
          const re = new Map()
          sorted.forEach(([p], i) => re.set(p, i + 1))
          return re
        }
        next.set(path, next.size + 1)
      } else {
        next.clear()
        next.set(path, 1)
      }

      lastClickedRef.current = path
      return next
    })
  }, [allItems])

  const selectAll = useCallback(() => {
    const m = new Map()
    allItems.forEach((item, i) => m.set(item.path, i + 1))
    setSelectionOrder(m)
  }, [allItems])

  const clearSelection = useCallback(() => {
    setSelectionOrder(new Map())
    lastClickedRef.current = null
  }, [])

  // Always-toggle: add if absent, remove if present — no single-select clearing
  const toggleItem = useCallback((path) => {
    setSelectionOrder(prev => {
      const next = new Map(prev)
      if (next.has(path)) {
        next.delete(path)
        // Compact renumber
        const sorted = [...next.entries()].sort((a, b) => a[1] - b[1])
        const re = new Map()
        sorted.forEach(([p], i) => re.set(p, i + 1))
        return re
      }
      next.set(path, next.size + 1)
      lastClickedRef.current = path
      return next
    })
  }, [])

  return {
    selectedItems,
    selectionOrder,
    toggleSelect,
    toggleItem,
    selectAll,
    clearSelection,
    setSelectionOrder,
  }
}
