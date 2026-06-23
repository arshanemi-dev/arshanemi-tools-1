'use client'

import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'

export default function DropZone({ onDrop, currentPath }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    let counter = 0

    const onDragEnter = (e) => {
      e.preventDefault()
      counter++
      if (e.dataTransfer?.types?.includes('Files')) setActive(true)
    }
    const onDragOver  = (e) => { e.preventDefault() }
    const onDragLeave = (e) => {
      e.preventDefault()
      counter--
      if (counter <= 0) { counter = 0; setActive(false) }
    }
    const onDropEvt  = (e) => {
      e.preventDefault()
      counter = 0
      setActive(false)
      const files = Array.from(e.dataTransfer?.files ?? [])
      if (files.length) onDrop(files)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover',  onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop',      onDropEvt)

    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover',  onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop',      onDropEvt)
    }
  }, [onDrop])

  if (!active) return null

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="absolute inset-4 rounded-[16px] border-2 border-dashed border-[#4f46e5] bg-[#4f46e5]/5 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[#1e1b4b] border border-[#4f46e5]/40 flex items-center justify-center">
          <Upload size={28} className="text-[#818cf8]" />
        </div>
        <p className="text-[#818cf8] font-semibold text-lg">Drop to upload</p>
        <p className="text-[#6b7280] text-sm">
          Files will be uploaded to{' '}
          <span className="text-[#4f46e5]">{currentPath || '/ (root)'}</span>
        </p>
      </div>
    </div>
  )
}
