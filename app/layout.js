import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import { ToastProvider } from '@/components/layout/ToastProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'MultiImageLink Generator',
  description: 'Dropbox file manager and image URL grouping tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <ToastProvider>
          <Header />
          <main className="min-h-screen bg-[#0a0a0a]">{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}
