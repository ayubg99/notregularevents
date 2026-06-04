import Stripe from 'stripe'

let _client: Stripe | null = null

export function getStripe(): Stripe {
  if (!_client) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    _client = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _client
}

// Backward-compatible proxy so existing callers using `stripe.xxx` still work
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_, prop: string | symbol) {
    return getStripe()[prop as keyof Stripe]
  },
})
