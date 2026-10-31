'use strict';

// Payment providers for Coach Renas — PLACEHOLDERS ONLY.
// Nothing here moves real money. Each provider reports whether its keys are
// set; until Renas adds real merchant accounts every payment stays "pending"
// and the coach approves it by hand in the coach panel (same flow as the
// prototype: the client uploads a transfer receipt, the coach confirms).
//
// Keys (all optional, see backend/.env.example):
//   GOOGLE_PLAY_PACKAGE_NAME, GOOGLE_PLAY_SERVICE_ACCOUNT_JSON  -> verify Play Billing purchase tokens
//   APPLE_IAP_SHARED_SECRET                                     -> verify App Store receipts
//   ZAINCASH_MERCHANT_ID, ZAINCASH_SECRET, ZAINCASH_MSISDN      -> ZainCash API (docs.zaincash.iq)
//   FIB_CLIENT_ID, FIB_CLIENT_SECRET                            -> First Iraqi Bank online payments
//   QI_MERCHANT_ID, QI_API_KEY                                  -> Qi Card gateway
//   COACH_RENAS_TRANSFER_FIB / _QI / _ZAINCASH                  -> account numbers shown to clients for manual transfer

const env = (k) => (process.env[k] || '').trim();

const PROVIDERS = {
  google_play: { label: 'Google Play', keys: ['GOOGLE_PLAY_PACKAGE_NAME', 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON'] },
  apple: { label: 'App Store', keys: ['APPLE_IAP_SHARED_SECRET'] },
  zaincash: { label: 'ZainCash', keys: ['ZAINCASH_MERCHANT_ID', 'ZAINCASH_SECRET', 'ZAINCASH_MSISDN'] },
  fib: { label: 'FIB', keys: ['FIB_CLIENT_ID', 'FIB_CLIENT_SECRET'] },
  qi: { label: 'Qi Card', keys: ['QI_MERCHANT_ID', 'QI_API_KEY'] },
  transfer: { label: 'Bank / wallet transfer (manual)', keys: [] },
  cash: { label: 'Cash', keys: [] },
};

function isConfigured(method) {
  const p = PROVIDERS[method];
  if (!p) return false;
  return p.keys.every((k) => env(k));
}

// Accounts shown to the client for a manual transfer. Placeholders until set.
function transferAccounts() {
  return [
    { method: 'fib', label: 'FIB', account: env('COACH_RENAS_TRANSFER_FIB') || '[FIB account number]' },
    { method: 'qi', label: 'Qi Card', account: env('COACH_RENAS_TRANSFER_QI') || '[Qi Card number]' },
    { method: 'zaincash', label: 'ZainCash', account: env('COACH_RENAS_TRANSFER_ZAINCASH') || '[ZainCash number]' },
  ];
}

// Start a payment. Always returns a pending state — real gateway calls are
// intentionally not implemented (no merchant accounts yet; see report).
async function startPayment({ method, amount, reference }) {
  const p = PROVIDERS[method];
  if (!p) return { ok: false, error: 'unknown_method' };
  const configured = isConfigured(method);
  return {
    ok: true,
    method,
    configured,
    status: 'pending',
    reference,
    amount,
    // When a real integration is added, return the gateway's redirect URL here.
    redirectUrl: null,
    message: configured
      ? `${p.label}: keys found, but the live integration is not written yet — the coach confirms by hand.`
      : `${p.label} is not set up yet — the coach confirms the payment by hand.`,
  };
}

// Verify a store purchase token/receipt. Placeholder: never auto-activates.
async function verifyStorePurchase({ method }) {
  return { verified: false, reason: isConfigured(method) ? 'not_implemented' : 'not_configured' };
}

function status() {
  return Object.entries(PROVIDERS).map(([method, p]) => ({ method, label: p.label, configured: isConfigured(method) }));
}

module.exports = { PROVIDERS, isConfigured, transferAccounts, startPayment, verifyStorePurchase, status };
