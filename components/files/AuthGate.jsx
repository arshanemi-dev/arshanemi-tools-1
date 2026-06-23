'use client'

import Link from 'next/link'
import { LockKeyhole, UserCircle, ArrowRight, Settings } from 'lucide-react'

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT?.toLowerCase() === 'true'

export default function AuthGate() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#0a0a0a]">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full opacity-[0.04] blur-3xl"
             style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-[16px] p-8 flex flex-col items-center text-center gap-5 shadow-2xl">

          {/* Icon */}
          <div className="relative">
            <div className="w-16 h-16 rounded-[14px] bg-[#0f0f1a] border border-[#4f46e5]/25 flex items-center justify-center">
              <LockKeyhole size={28} className="text-[#4f46e5]" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ef4444] border-2 border-[#111111]" />
          </div>

          {/* Copy */}
          <div>
            <h2 className="text-lg font-bold text-[#f5f5f5] mb-2">
              {IS_CONNECT ? 'Sign in required' : 'No active user'}
            </h2>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              {IS_CONNECT
                ? 'Sign in to your admin account to access the file manager.'
                : 'Create and activate a local user in Settings to get started.'}
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[#1a1a1a]" />

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
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-sm font-bold rounded-[10px] transition-all active:scale-[0.98]"
          >
            <Settings size={15} />
            Go to Settings
            <ArrowRight size={14} />
          </Link>

          {/* Hint */}
          <p className="text-[10px] text-[#3a3a3a]">
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
      <span className="w-5 h-5 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center text-[10px] font-bold text-[#6b7280] shrink-0">
        {n}
      </span>
      <span className="text-xs text-[#6b7280]">{text}</span>
    </div>
  )
}
