'use client'

import Link from 'next/link'
import { LockKeyhole, UserCircle, ArrowRight, Settings } from 'lucide-react'

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT?.toLowerCase() === 'true'

export default function AuthGate() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[var(--lt-bg-base)]">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full opacity-[0.04] blur-3xl"
             style={{ background: 'radial-gradient(circle, var(--lt-accent) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-[var(--lt-surface)] border border-[var(--lt-divider)] rounded-[16px] p-8 flex flex-col items-center text-center gap-5 shadow-2xl">

          {/* Icon */}
          <div className="relative">
            <div className="w-16 h-16 rounded-[14px] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/25 flex items-center justify-center">
              <LockKeyhole size={28} className="text-[var(--lt-accent)]" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ef4444] border-2 border-[var(--lt-surface)]" />
          </div>

          {/* Copy */}
          <div>
            <h2 className="text-lg font-bold text-[var(--lt-text-primary)] mb-2">
              {IS_CONNECT ? 'Sign in required' : 'No active user'}
            </h2>
            <p className="text-sm text-[var(--lt-text-subtle)] leading-relaxed">
              {IS_CONNECT
                ? 'Sign in to your admin account to access the file manager.'
                : 'Create and activate a local user in Settings to get started.'}
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[var(--lt-divider)]" />

          {/* Steps hint */}
          <div className="w-full flex flex-col gap-2.5">
            {IS_CONNECT ? (
              <Step n={1} text="Go to Settings" />
            ) : (
              <>
                <Step n={1} text="Open Settings → Users" />
                <Step n={2} text="Create a user (any role)" />
                <Step n={3} text="Click Activate on that user" />
              </>
            )}
          </div>

          {/* CTA */}
          <Link
            href="/settings"
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--lt-accent)] hover:bg-[var(--lt-accent-hover)] text-white text-sm font-bold rounded-[10px] transition-all active:scale-[0.98]"
          >
            <Settings size={15} />
            Go to Settings
            <ArrowRight size={14} />
          </Link>

          {/* Hint */}
          <p className="text-[10px] text-[var(--lt-text-subtle)]">
            You'll be brought back here after setup
          </p>
        </div>
      </div>
    </div>
  )
}

function Step({ n, text }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <span className="w-5 h-5 rounded-full bg-[var(--lt-divider)] border border-[var(--lt-divider-light)] flex items-center justify-center text-[10px] font-bold text-[var(--lt-text-subtle)] shrink-0">
        {n}
      </span>
      <span className="text-xs text-[var(--lt-text-subtle)]">{text}</span>
    </div>
  )
}
