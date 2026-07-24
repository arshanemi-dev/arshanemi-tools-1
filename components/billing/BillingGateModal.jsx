'use client'

import AccessUnauthorizedModal from './AccessUnauthorizedModal'
import InsufficientCoinsModal from './InsufficientCoinsModal'
import BillingErrorModal from './BillingErrorModal'

// Orchestrator — one mounted instance per call site, driven by whatever
// runBillingGate() last returned. `onRetry` re-invokes the original handler
// (see lib/toolBilling.js's waterfall doc comment).
//
// No modal here lets the user self-serve an activation — turning a
// recurring feature on/off only ever happens from the admin panel's own
// /settings/plan. 'activation_required' is purely informational.
export default function BillingGateModal({ gate, onClose, onRetry, toast }) {
  if (!gate) return null
  const { reason, data } = gate

  if (reason === 'insufficient_coins' || reason === 'coins_expired') {
    return <InsufficientCoinsModal open onClose={onClose} reason={reason} data={data} />
  }
  if (reason === 'error') {
    // A genuine failure (network/server error, unexpected response) — never
    // shown as "access denied", and retryable since it's likely transient.
    return <BillingErrorModal open onClose={onClose} onRetry={onRetry} data={data} />
  }
  if (reason === 'activation_required') {
    return (
      <AccessUnauthorizedModal
        open
        onClose={onClose}
        message={`${data?.featureTitle ?? 'This feature'} isn't activated for your account yet. Manage feature activation from your account's Plan page.`}
      />
    )
  }
  // 'access_denied' | 'feature_unavailable' — close-only, no retry
  return (
    <AccessUnauthorizedModal
      open
      onClose={onClose}
      message={reason === 'feature_unavailable' ? 'This feature isn’t available right now.' : undefined}
    />
  )
}
