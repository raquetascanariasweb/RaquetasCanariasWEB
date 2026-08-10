import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

interface ScrapedProduct {
  name: string
  price: string
  original_price: string | null
  brand: string | null
  category: string
  image_url: string
  slug: string
  source_url: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function parsePrice(value: string | null): number {
  if (!value) return 0
  const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".")
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : Math.round(num * 100)
}

async function main() {
  console.log("Reading scraped products...")
  let raw = readFileSync(
    resolve(__dirname, "..", ".just-scrape", "sportbalin-products.json"),
    "utf-8"
  )
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1)
  const products: ScrapedProduct[] = JSON.parse(raw)
  console.log(`Found ${products.length} products\n`)

  const catMap = new Map<string, string>()

  console.log("Creating categories...")
  for (const p of products) {
    const slug = slugify(p.category)
    if (catMap.has(slug)) continue

    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (existing) {
      catMap.set(slug, existing.id)
      continue
    }

    const { data: created, error } = await supabase
      .from("categories")
      .insert({ name: p.category, slug })
      .select("id")
      .single()

    if (error) {
      console.error(`  FAIL ${p.category}: ${error.message}`)
      catMap.set(slug, "")
    } else {
      catMap.set(slug, created.id as string)
      console.log(`  OK   ${p.category}`)
    }
  }
  console.log()

  console.log("Importing products...")
  let inserted = 0
  let failed = 0

  for (const p of products) {
    const catSlug = slugify(p.category)
    const categoryId = catMap.get(catSlug) || null
    const priceCents = parsePrice(p.price)
    const compareAtCents = p.original_price ? parsePrice(p.original_price) : null
    const images = p.image_url ? [{ url: p.image_url, color: "" }] : []

    const { error } = await supabase.from("products").upsert(
      {
        name: p.name,
        slug: p.slug,
        description: p.brand ? `Marca: ${p.brand}` : "",
        materials: p.brand || "",
        price_cents: priceCents,
        compare_at_price_cents: compareAtCents,
        category_id: categoryId,
        images,
        sizes: [],
        colors: [],
        in_stock: true,
        status: "active",
      },
      { onConflict: "slug" }
    )

    if (error) {
      console.error(`  FAIL ${p.name}: ${error.message}`)
      failed++
    } else {
      inserted++
    }
  }

  console.log(`\nDone. ${inserted} inserted/updated, ${failed} failed.`)
}

main().catch(console.error)
