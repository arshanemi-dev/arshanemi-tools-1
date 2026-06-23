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
      if (!onDrop) return
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

  const disabled = !onDrop

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className={`absolute inset-4 rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center gap-3 backdrop-blur-[2px] ${
        disabled
          ? 'border-[#6b7280] bg-[#6b7280]/5'
          : 'border-[#4f46e5] bg-[#4f46e5]/5'
      }`}>
        <div className={`w-16 h-16 rounded-full border flex items-center justify-center ${
          disabled ? 'bg-[#1c1c1c] border-[#333333]' : 'bg-[#1e1b4b] border-[#4f46e5]/40'
        }`}>
          <Upload size={28} className={disabled ? 'text-[#6b7280]' : 'text-[#818cf8]'} />
        </div>
        {disabled ? (
          <>
            <p className="text-[#6b7280] font-semibold text-lg">Upload disabled</p>
            <p className="text-[#6b7280] text-sm">Select a single folder to enable upload</p>
          </>
        ) : (
          <>
            <p className="text-[#818cf8] font-semibold text-lg">Drop to upload</p>
            <p className="text-[#6b7280] text-sm">
              Files will upload to{' '}
              <span className="text-[#4f46e5]">{currentPath || '/ (root)'}</span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
