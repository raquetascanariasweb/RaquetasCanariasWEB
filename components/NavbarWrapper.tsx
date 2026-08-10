"use client"

import { useMemo } from "react"
import Navbar from "./Navbar"
import type { Category } from "@/types/product"

function buildTree(flat: Category[]): Category[] {
  const map = new Map<string, Category>()
  for (const c of flat) map.set(c.id, { ...c, children: [] })

  const roots: Category[] = []
  for (const c of map.values()) {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(c)
    } else {
      roots.push(c)
    }
  }
  return roots
}

export default function NavbarWrapper({ categories }: { categories: Category[] }) {
  const tree = useMemo(() => buildTree(categories), [categories])
  return <Navbar categories={tree} />
}
