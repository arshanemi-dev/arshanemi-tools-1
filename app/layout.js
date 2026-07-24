import { Inter } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/layout/ToastProvider'
import { SelectedFilesProvider } from '@/context/SelectedFilesContext'
import { ThemeProvider } from '@/context/ThemeContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'MultiImageLink Generator',
  description: 'Dropbox file manager and image URL grouping tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} h-full flex flex-col`}>
        <ThemeProvider>
          <ToastProvider>
            <SelectedFilesProvider>
              <AppShell>
                {children}
              </AppShell>
            </SelectedFilesProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
