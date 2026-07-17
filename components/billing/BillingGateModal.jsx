'use client'

import AccessUnauthorizedModal from './AccessUnauthorizedModal'
import PayToUnlockModal from './PayToUnlockModal'
import InsufficientCoinsModal from './InsufficientCoinsModal'
import BillingErrorModal from './BillingErrorModal'

// Orchestrator — one mounted instance per call site, driven by whatever
// runBillingGate() last returned. `onRetry` re-invokes the original handler
// (see lib/toolBilling.js's waterfall doc comment for why the whole handler
// re-runs rather than just resuming after payment).
export default function BillingGateModal({ gate, onClose, onRetry, toast }) {
  if (!gate) return null
  const { reason, data } = gate

  if (reason === 'fee_required') {
    return <PayToUnlockModal open onClose={onClose} data={data} onSuccess={onRetry} toast={toast} />
  }
  if (reason === 'insufficient_coins' || reason === 'coins_expired') {
    return <InsufficientCoinsModal open onClose={onClose} reason={reason} data={data} />
  }
  if (reason === 'error') {
    // A genuine failure (network/server error, unexpected response) — never
    // shown as "access denied", and retryable since it's likely transient.
    return <BillingErrorModal open onClose={onClose} onRetry={onRetry} data={data} />
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
