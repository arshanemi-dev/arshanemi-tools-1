import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import { ToastProvider } from '@/components/layout/ToastProvider'
import LoginModal from '@/components/ui/LoginModal'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'MultiImageLink Generator',
  description: 'Dropbox file manager and image URL grouping tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans h-full flex flex-col`}>
        <ToastProvider>
          <Header />
          <main className="flex-1 overflow-hidden bg-[#0a0a0a]">{children}</main>
          <LoginModal />
        </ToastProvider>
      </body>
    </html>
  )
}
