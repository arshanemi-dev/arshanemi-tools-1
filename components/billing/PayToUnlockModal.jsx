'use client'

import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { createFeeOrder, verifyFeePayment } from '@/lib/toolBilling'

// "Pay to Unlock" — one-time Fix-Fee purchase for a single feature. Mirrors
// the admin panel's components/admin/plan/CoinPlansTable.jsx Razorpay pattern
// (key/amount/order_id/handler), scoped to one feature instead of a coin pack.
export default function PayToUnlockModal({ open, onClose, data, onSuccess, toast }) {
  const [loading, setLoading] = useState(false)
  const { featureTitle, fixFeePaise, toolSlug, featureApiIdentifier } = data || {}

  async function handlePay() {
    if (typeof window === 'undefined' || !window.Razorpay) {
      toast?.('Payment gateway is still loading — try again in a moment', 'error')
      return
    }
    setLoading(true)
    try {
      const order = await createFeeOrder({ toolSlug, featureApiIdentifier })
      if (!order.ok) throw new Error(order.error || 'Could not start checkout')

      if (order.alreadyPaid) {
        toast?.('Already unlocked!', 'success')
        onSuccess?.()
        onClose?.()
        return
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: 'INR',
        name: 'Arshanemi',
        description: `Unlock — ${order.featureTitle ?? featureTitle}`,
        order_id: order.orderId,
        theme: { color: '#4f46e5' },
        modal: { ondismiss: () => setLoading(false) },
        handler: async (response) => {
          try {
            const result = await verifyFeePayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            if (!result.ok) throw new Error(result.error || 'Payment verification failed')
            toast?.('Unlocked!', 'success')
            onSuccess?.()
            onClose?.()
          } catch (err) {
            toast?.(err.message, 'error')
          } finally {
            setLoading(false)
          }
        },
      })
      rzp.on('payment.failed', () => {
        toast?.('Payment failed — please try again', 'error')
        setLoading(false)
      })
      rzp.open()
    } catch (err) {
      toast?.(err.message, 'error')
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Pay to Unlock" size="sm">
      <div className="flex flex-col items-center text-center gap-3 py-2">
        <div className="w-12 h-12 rounded-full bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/30 flex items-center justify-center">
          <Lock size={20} className="text-[var(--lt-accent-light)]" />
        </div>
        <p className="text-sm text-[var(--lt-text-muted)]">
          Unlock <span className="font-semibold text-[var(--lt-text-primary)]">{featureTitle}</span> with a one-time payment.
        </p>
        <p className="text-2xl font-bold text-[var(--lt-text-primary)]">₹{((fixFeePaise || 0) / 100).toLocaleString('en-IN')}</p>
        <button
          onClick={handlePay}
          disabled={loading}
          className="mt-2 flex items-center justify-center gap-2 px-5 h-9 rounded-[8px] text-xs font-semibold bg-[var(--lt-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? (<><Loader2 size={14} className="animate-spin" /> Processing…</>) : 'Pay to Unlock'}
        </button>
      </div>
    </Modal>
  )
}
