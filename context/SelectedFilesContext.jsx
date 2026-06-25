'use client'
import { createContext, useContext, useState } from 'react'

const SelectedFilesContext = createContext(null)

export function SelectedFilesProvider({ children }) {
  // Array of { name, path } objects for files currently selected in the file manager
  const [selectedFiles, setSelectedFiles] = useState([])

  return (
    <SelectedFilesContext.Provider value={{ selectedFiles, setSelectedFiles }}>
      {children}
    </SelectedFilesContext.Provider>
  )
}

export function useSelectedFiles() {
  const ctx = useContext(SelectedFilesContext)
  if (!ctx) throw new Error('useSelectedFiles must be used within SelectedFilesProvider')
  return ctx
}
