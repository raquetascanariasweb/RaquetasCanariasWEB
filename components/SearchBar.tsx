"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

export default function SearchBar() {
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/?search=${encodeURIComponent(trimmed)}`)
      inputRef.current?.blur()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div
        className={`flex items-center gap-2 rounded-lg border bg-black/30 px-3 h-9 transition-all duration-300 ${
          focused
            ? "border-ember/50 shadow-[0_0_12px_-2px_rgba(196,227,38,0.2)]"
            : "border-white/15"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 transition-colors duration-300 ${
            focused ? "text-ember" : "text-white/40"
          }`}
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Buscar productos..."
          className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
        />
      </div>
    </form>
  )
}
