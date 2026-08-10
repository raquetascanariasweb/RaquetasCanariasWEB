"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

interface SearchBarProps {
  autoFocus?: boolean
  onClose?: () => void
}

export default function SearchBar({ autoFocus = false, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/?search=${encodeURIComponent(trimmed)}`)
      inputRef.current?.blur()
      onClose?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar..."
        className="w-full bg-transparent text-[13px] text-ink placeholder-linen outline-none border-b border-[#E5E0D8] py-1 focus:border-ink transition-colors"
      />
    </form>
  )
}
