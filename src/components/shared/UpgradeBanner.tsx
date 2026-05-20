'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

interface Props {
  tier: string
}

export default function UpgradeBanner({ tier }: Props) {
  useEffect(() => {
    const label = tier === 'pro' ? 'Pro' : 'Basic'
    toast.success(`Planul ${label} activat! Bun venit 🎉`, {
      description: 'Toate funcțiile planului tău sunt acum disponibile.',
      duration: 6000,
    })
  }, [tier])

  return null
}
