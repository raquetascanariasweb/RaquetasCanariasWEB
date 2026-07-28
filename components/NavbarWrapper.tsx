"use client"

import { usePathname } from "next/navigation"
import Navbar from "./Navbar"

export default function NavbarWrapper({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const pathname = usePathname()
  if (pathname.startsWith("/admin")) return null
  return <Navbar categories={categories} />
}
