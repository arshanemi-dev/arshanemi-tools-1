'use client'
// Cross-app tool billing gate — client for the admin panel's Fix-Fee +
// Coin-Wallet APIs. See plan/tools-pricing-cut-paln.md (admin panel repo) §6/§7.
//
// Gated on NEXT_PUBLIC_IS_PAID, not NEXT_PUBLIC_IS_CONNECT — IS_CONNECT only
// governs auth/login against the admin panel (see AppShell.jsx), IS_PAID is
// the independent switch for whether billing enforcement runs at all. When
// IS_PAID !== 'true', runBillingGate() short-circuits to 'proceed' with zero
// network calls — unchanged behavior for anyone not running paid mode.

import { authFetch } from '@/lib/tokenStore'

const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? ''

async function getMyTool(toolSlug) {
  try {
    const res = await authFetch(`${API_BASE}/api/tools/my`)
    if (!res.ok) return null
    const tools = await res.json()
    return tools.find((t) => t.slug === toolSlug) ?? null
  } catch {
    return null
  }
}

async function createFeeOrder({ toolSlug, featureApiIdentifier }) {
  const res = await authFetch(`${API_BASE}/api/wallet/tool-fee/order`, {
    method: 'POST',
    body: JSON.stringify({ toolSlug, featureApiIdentifier }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, ...data }
}

async function verifyFeePayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const res = await authFetch(`${API_BASE}/api/wallet/tool-fee/verify`, {
    method: 'POST',
    body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, ...data }
}

async function deductFeatureCoins({ toolSlug, featureApiIdentifier, idempotencyKey }) {
  const res = await authFetch(`${API_BASE}/api/wallet/deduct`, {
    method: 'POST',
    body: JSON.stringify({ toolSlug, featureApiIdentifier, idempotencyKey }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, ...data }
}

// The waterfall — access → feature-exists → fee → coin cost. Call this as
// the first statement after any trivial empty-input guard, before real work,
// at every billable call site. On `blocked`, open BillingGateModal with
// {reason, data} and re-invoke the whole calling handler once the modal
// resolves (Pay-to-Unlock only clears the fee gate — the coin-cost gate
// still needs to run right after).
export async function runBillingGate({ toolSlug, featureApiIdentifier }) {
  if (process.env.NEXT_PUBLIC_IS_PAID !== 'true') return { status: 'proceed' }

  const myTool = await getMyTool(toolSlug)
  if (!myTool) return { status: 'blocked', reason: 'access_denied', data: { toolSlug } }

  const feature = myTool.features?.find((f) => f.apiIdentifier === featureApiIdentifier)
  if (!feature || !feature.isActive) {
    return { status: 'blocked', reason: 'feature_unavailable', data: { toolSlug, featureApiIdentifier } }
  }

  if (feature.fixFeePaise > 0 && !feature.feePaid) {
    return {
      status: 'blocked',
      reason: 'fee_required',
      data: { toolSlug, featureApiIdentifier, featureTitle: feature.title, fixFeePaise: feature.fixFeePaise },
    }
  }

  if (!feature.coinCost) return { status: 'proceed' }

  const result = await deductFeatureCoins({ toolSlug, featureApiIdentifier, idempotencyKey: crypto.randomUUID() })
  if (result.ok) return { status: 'proceed', data: { usageId: result.usageId, remainingCoins: result.remainingCoins } }
  if (result.error === 'insufficient_coins') {
    return { status: 'blocked', reason: 'insufficient_coins', data: { remainingCoins: result.remainingCoins, requiredCoins: feature.coinCost } }
  }
  if (result.error === 'coins_expired') {
    return { status: 'blocked', reason: 'coins_expired', data: { expiredAt: result.expiredAt } }
  }
  if (result.error === 'fee_required') {
    // Defense-in-depth: client thought it was paid, server disagreed (e.g. a
    // stale cached getMyTool() response) — /api/wallet/deduct's own check is
    // the real gate, this branch is just surfacing it.
    return {
      status: 'blocked',
      reason: 'fee_required',
      data: { toolSlug, featureApiIdentifier, featureTitle: feature.title, fixFeePaise: result.fixFeePaise },
    }
  }
  return { status: 'blocked', reason: 'error', data: { message: result.error } }
}

export { getMyTool, createFeeOrder, verifyFeePayment, deductFeatureCoins }
