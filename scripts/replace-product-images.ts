import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import https from "node:https"
import http from "node:http"
import { randomUUID } from "node:crypto"

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

function fetchImage(url: string): Promise<{ data: Buffer; contentType: string }> {
  return new Promise((resolvePromise, reject) => {
    const protocol = url.startsWith("https") ? https : http
    protocol.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchImage(res.headers.location).then(resolvePromise).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      const chunks: Buffer[] = []
      res.on("data", (chunk: Buffer) => chunks.push(chunk))
      res.on("end", () => {
        resolvePromise({ data: Buffer.concat(chunks), contentType: res.headers["content-type"] || "image/jpeg" })
      })
      res.on("error", reject)
    }).on("error", reject)
  })
}

function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
  }
  return map[contentType] || "jpg"
}

function highResUrl(thumbnailUrl: string): string {
  return thumbnailUrl.replace(/imagecache\/[^/]+\//, "")
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

  // Build map: slug -> high-res URL (keep first unique per slug)
  const slugImageMap = new Map<string, string>()
  for (const p of products) {
    if (!slugImageMap.has(p.slug) && p.image_url) {
      slugImageMap.set(p.slug, highResUrl(p.image_url))
    }
  }
  console.log(`Unique product images to fetch: ${slugImageMap.size}\n`)

  // Fetch existing products from DB matching slugs
  const slugs = Array.from(slugImageMap.keys())
  const batchSize = 100
  const dbProducts: { id: string; slug: string; name: string; images: any[] }[] = []

  for (let i = 0; i < slugs.length; i += batchSize) {
    const batch = slugs.slice(i, i + batchSize)
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, images")
      .in("slug", batch)
    if (error) {
      console.error(`Failed to fetch products batch: ${error.message}`)
    } else if (data) {
      dbProducts.push(...data)
    }
  }

  console.log(`Matched ${dbProducts.length} products in database\n`)

  let downloaded = 0
  let uploaded = 0
  let failed = 0

  for (const product of dbProducts) {
    const hrUrl = slugImageMap.get(product.slug)
    if (!hrUrl) continue

    process.stdout.write(`[${downloaded + failed + 1}/${dbProducts.length}] ${product.name.slice(0, 60)}... `)

    // 1. Download high-res image
    let imageData: Buffer
    let contentType: string
    try {
      const result = await fetchImage(hrUrl)
      imageData = result.data
      contentType = result.contentType
    } catch (err: any) {
      console.log(`DOWNLOAD FAIL: ${err.message}`)
      failed++
      continue
    }
    downloaded++
    const ext = getExtension(contentType)

    // 2. Upload to Supabase Storage
    const fileName = `${randomUUID()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageData, {
        contentType,
        cacheControl: "3600",
      })

    if (uploadErr) {
      console.log(`UPLOAD FAIL: ${uploadErr.message}`)
      failed++
      continue
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName)

    const newUrl = publicUrlData.publicUrl
    uploaded++

    // 3. Update product in DB
    const { error: updateErr } = await supabase
      .from("products")
      .update({
        images: [{ url: newUrl, color: (product.images?.[0] as any)?.color || "" }],
      })
      .eq("id", product.id)

    if (updateErr) {
      console.log(`DB UPDATE FAIL: ${updateErr.message}`)
      failed++
    } else {
      console.log(`OK (${(imageData.length / 1024).toFixed(0)}KB)`)
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 100))
  }

  console.log(`\nDone. Downloaded: ${downloaded}, Uploaded: ${uploaded}, Failed: ${failed}`)
  console.log(`Supabase URL: ${supabaseUrl}`)
}

main().catch(console.error)
