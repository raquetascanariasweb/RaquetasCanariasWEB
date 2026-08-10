import { createClient } from "@supabase/supabase-js"

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const parents: { name: string; slug: string; children: string[] }[] = [
  {
    name: "Pádel",
    slug: "padel",
    children: ["Palas Padel", "Bolsas Padel", "Pelotas Padel", "Accesorios Padel", "Textil Padel"],
  },
  {
    name: "Tenis",
    slug: "tenis",
    children: ["Raquetas Tenis", "Cordajes Tenis", "Accesorios Tenis", "Textil Tenis"],
  },
  {
    name: "Squash",
    slug: "squash",
    children: ["Raquetas Squash", "Calzado Squash", "Pelotas Squash", "Cordajes Squash", "Squash Cordajes", "Squash/Accesorios", "Textil Squash"],
  },
  {
    name: "Trekking",
    slug: "trekking",
    children: ["Bastones De Trekking", "Bastones Trekking", "Bastones Trail Running", "Calzado Trekking", "Mochilas Trekking", "Accesorios Trekking", "Textil Trekking", "Mochilas"],
  },
  {
    name: "Running",
    slug: "running",
    children: ["Running", "Accesorios Running", "Textil Running", "Pulsometros", "Puls\u00f3Metros"],
  },
  {
    name: "Natación",
    slug: "natacion",
    children: ["Accesorios Nataci\u00f3N", "Ba\u00f1Adores Hombre", "Tubo Frontal Nataci\u00f3N"],
  },
  {
    name: "Fitness",
    slug: "fitness",
    children: ["Accesorios Fitness", "Textil Fitness"],
  },
]

async function main() {
  const { data: existing } = await s.from("categories").select("id, name, slug").order("name")
  if (!existing) return console.error("No categories found")

  console.log("Creating parent categories...")
  for (const p of parents) {
    let parent = existing.find((c) => c.slug === p.slug)
    if (!parent) {
      const { data: created } = await s
        .from("categories")
        .insert({ name: p.name, slug: p.slug })
        .select("id")
        .single()
      parent = created as any
      console.log(`  Created parent: ${p.name}`)
    }

    const childIds = existing
      .filter((c) => p.children.includes(c.name))
      .map((c) => c.id)

    if (childIds.length === 0) continue

    const { error } = await s
      .from("categories")
      .update({ parent_id: (parent as any).id })
      .in("id", childIds)

    if (error) {
      console.error(`  Failed to update children for ${p.name}: ${error.message}`)
    } else {
      console.log(`  ${p.name} ← ${childIds.length} subcategorías`)
    }
  }

  // Delete duplicate categories "Running" (slug running, it's now a parent)
  // ...keep it as a parent with children

  console.log("\nDone.")
}

main().catch(console.error)
