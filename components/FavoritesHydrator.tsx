"use client"

import { useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { useFavoritesStore } from "@/store/favorites-store"
import { getFavorites } from "@/services/favorites"

export default function FavoritesHydrator() {
  const { isSignedIn, isLoaded } = useUser()
  const setItems = useFavoritesStore((s) => s.setItems)
  const hydratingRef = useRef(false)

  useEffect(() => {
    if (!isLoaded) return
    if (hydratingRef.current) return

    if (isSignedIn) {
      hydratingRef.current = true
      getFavorites().then((favs) => {
        setItems(favs)
        hydratingRef.current = false
      })
    } else {
      setItems([])
    }
  }, [isSignedIn, isLoaded, setItems])

  return null
}
