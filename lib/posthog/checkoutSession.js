'use client'

const CHECKOUT_SESSION_ID_KEY = 'ksarwar.checkoutSessionId.v1'

function createCheckoutSessionId() {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `checkout.${id}`
}

export function getOrCreateCheckoutSessionId() {
  if (typeof window === 'undefined') {
    return ''
  }

  const existingId = window.sessionStorage.getItem(CHECKOUT_SESSION_ID_KEY)

  if (existingId) {
    return existingId
  }

  const nextId = createCheckoutSessionId()
  window.sessionStorage.setItem(CHECKOUT_SESSION_ID_KEY, nextId)
  return nextId
}

export function resetCheckoutSessionId() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(CHECKOUT_SESSION_ID_KEY)
}
