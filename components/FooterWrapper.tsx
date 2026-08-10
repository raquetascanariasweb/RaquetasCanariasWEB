"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface FooterData {
  copyright_text?: string
  newsletter_text?: string
  columns?: { title: string; links: { label: string; url: string }[] }[]
  social_links?: { platform: string; url: string }[]
}

export default function FooterWrapper() {
  const [footer, setFooter] = useState<FooterData | null>(null)

  useEffect(() => {
    fetch("/api/public/footer")
      .then((r) => r.json())
      .then((data) => {
        if (data && Object.keys(data).length > 0) setFooter(data)
      })
      .catch(() => {})
  }, [])

  if (!footer) {
    return (
      <footer className="border-t border-[#DDD8CC] py-10 text-center text-sm text-[#A09C95]">
        <div className="container-main">
          <p>&copy; {new Date().getFullYear()} Sportbalin. Todos los derechos reservados.</p>
        </div>
      </footer>
    )
  }

  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[#DDD8CC] bg-white">
      <div className="container-main py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {(footer.columns || []).map((col, i) => (
            <div key={i}>
              <h4 className="text-sm font-semibold text-ink mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <Link href={link.url} className="text-sm text-ink/60 hover:text-ink transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {footer.newsletter_text && (
            <div>
              <h4 className="text-sm font-semibold text-ink mb-4">Newsletter</h4>
              <p className="text-sm text-ink/60 mb-3">{footer.newsletter_text}</p>
            </div>
          )}
        </div>
        <div className="mt-10 pt-6 border-t border-[#DDD8CC] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink/40">
            {footer.copyright_text || `\u00A9 ${year} Sportbalin. Todos los derechos reservados.`}
          </p>
          {(footer.social_links || []).length > 0 && (
            <div className="flex items-center gap-4">
              {footer.social_links!.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-ink/40 hover:text-ink transition-colors">
                  {s.platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
