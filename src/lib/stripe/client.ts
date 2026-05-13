import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const PLANS = {
  basic: {
    name: 'Basic',
    priceRon: 49,
    priceId: process.env.STRIPE_PRICE_BASIC!,
  },
  pro: {
    name: 'Pro',
    priceRon: 79,
    priceId: process.env.STRIPE_PRICE_PRO!,
  },
} as const
