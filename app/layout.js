import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import { ToastProvider } from '@/components/layout/ToastProvider'
import { SelectedFilesProvider } from '@/context/SelectedFilesContext'
import { ThemeProvider } from '@/context/ThemeContext'
import LoginModal from '@/components/ui/LoginModal'

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
              <Header />
              <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--lt-bg-base)' }}>
                {children}
              </main>
              <LoginModal />
            </SelectedFilesProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
