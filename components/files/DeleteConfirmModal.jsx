'use client'

import { Trash2 } from 'lucide-react'
import Modal  from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function DeleteConfirmModal({ open, onClose, paths = [], onConfirm }) {
  return (
    <Modal open={open} onClose={onClose} title="Confirm Delete" size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#450a0a] border border-[#ef4444]/30 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-[#ef4444]" />
          </div>
          <div>
            <p className="text-sm text-[#f5f5f5] mb-1">
              Delete {paths.length} item{paths.length > 1 ? 's' : ''}?
            </p>
            <p className="text-xs text-[#6b7280]">
              This action cannot be undone. Files will be permanently removed from Dropbox.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </Modal>
  )
}
