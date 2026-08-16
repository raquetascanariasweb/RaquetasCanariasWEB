'use client'

import React, { useState, useEffect, type ReactNode } from 'react'

interface ContextAction {
  label: string
  icon?: ReactNode
  onClick: () => void
  destructive?: boolean
}

interface Props {
  actions: ContextAction[]
  children: ReactNode
}

export default function RowContextMenu({ actions, children }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!open) return
    function handleClick() { setOpen(false) }
    setTimeout(() => document.addEventListener('mousedown', handleClick), 0)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setPos({ x: e.clientX, y: e.clientY })
    setOpen(true)
  }

  const child = React.Children.only(children) as React.ReactElement<any>
  const cloned = React.cloneElement(child, { onContextMenu: handleContextMenu })

  return (
    <>
      {cloned}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 w-44 rounded-md border border-admin-border bg-admin-surface p-1 shadow-lg"
            style={{ left: pos.x, top: pos.y }}
          >
            {actions.map((action, i) => (
              <button
                key={i}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm hover:bg-white/5 ${
                  action.destructive ? 'text-destructive hover:text-destructive' : 'text-popover-foreground'
                }`}
                onClick={(e) => { e.stopPropagation(); action.onClick(); setOpen(false) }}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}
