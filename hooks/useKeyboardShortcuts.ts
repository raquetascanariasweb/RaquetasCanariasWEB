'use client'

import { useEffect } from 'react'

interface ShortcutMap {
  [key: string]: () => void
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape') {
          shortcuts['Escape']?.()
        }
        return
      }

      for (const [key, fn] of Object.entries(shortcuts)) {
        if (key === 'Escape' && e.key === 'Escape') { fn(); return }
        if (key === 'Delete' && (e.key === 'Delete' || e.key === 'Backspace')) { fn(); return }
        if (key === 'n' && e.key === 'n' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); fn(); return }
        if (key === 'k' && (e.key === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); fn(); return }
        if (key === 'CtrlA' && e.key === 'a' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); fn(); return }
        if (key === '?' && e.key === '?' && !e.metaKey && !e.ctrlKey) { fn(); return }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts, enabled])
}
