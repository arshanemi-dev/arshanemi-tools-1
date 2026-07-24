// Central declaration of this app's billing identifiers, for use with
// lib/toolBilling.js's runBillingGate({ toolSlug, featureApiIdentifier }).
//
// Keep in sync with the admin panel repo's data/tools.js `link-generator`
// entry — any apiIdentifier used here must exist there with a matching
// coinCost/fixFeeCoins, or runBillingGate() will treat it as unavailable.
//
// Usage at a call site:
//   import { TOOL_SLUG, FEATURES } from '@/lib/toolFeatures'
//   const gate = await runBillingGate({ toolSlug: TOOL_SLUG, featureApiIdentifier: FEATURES.IMAGE_UPLOAD })
//
// Copy-link/export/folder-organize features (and their apiIdentifiers) were
// removed along with the matching app UI — the app only ships what's in the
// catalog (Browse, Upload, Storage) — see data/tools.js's link-generator entry.

export const TOOL_SLUG = 'link-generator'

export const FEATURES = {
  // BROWSE: 'link-browse',                 // free — core navigation
  IMAGE_UPLOAD: 'link-image-upload',     // 1 coin per file uploaded, quantity-charged per batch
  // link-storage-gb-month intentionally has no entry here — it's never
  // called via runBillingGate, it's billed by the admin panel's
  // scripts/cron-storage-billing.mjs off the running total reported by
  // reportStorageUsage() below.
}
