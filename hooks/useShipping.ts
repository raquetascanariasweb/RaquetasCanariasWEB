"use client"

import { useEffect, useState, useCallback } from "react"

interface ShippingSettings {
  shipping_rate: number
  free_shipping_threshold: number
}

const defaults: ShippingSettings = { shipping_rate: 10, free_shipping_threshold: 200 }

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value)
}

export function useShipping() {
  const [settings, setSettings] = useState<ShippingSettings>(defaults)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch("/api/public/shipping")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch shipping settings")
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setSettings({
          shipping_rate: isValidNumber(data.shipping_rate)
            ? data.shipping_rate
            : defaults.shipping_rate,
          free_shipping_threshold: isValidNumber(data.free_shipping_threshold)
            ? data.free_shipping_threshold
            : defaults.free_shipping_threshold,
        })
      })
      .catch((e) => {
        console.error("[useShipping] Error fetching settings:", e)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const shippingCost = useCallback(
    (subtotalCents: number) => {
      return subtotalCents >= settings.free_shipping_threshold * 100
        ? 0
        : settings.shipping_rate * 100
    },
    [settings]
  )

  return { settings, isLoading, shippingCost }
}
