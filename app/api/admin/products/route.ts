import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadProductImages } from '@/lib/supabase/storage'
import { escapeLike } from '@/lib/utils'

const DeleteProductSchema = z.object({
  id: z.string().uuid(),
})

function checkAdmin(userId: string | null) {
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID
  return userId === adminId
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!checkAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    const search = searchParams.get('search')

    const supabase = createAdminClient()
    let query = supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (search) {
      query = query.ilike('name', `%${escapeLike(search)}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const mapped = (data ?? []).map((p: Record<string, unknown>) => ({
      ...p,
      category_name: (p.categories as { name: string } | null)?.name ?? null,
      categories: undefined,
    }))

    return NextResponse.json(mapped)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID

    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const formData = await request.formData()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const materials = formData.get('materials') as string
    const priceCents = parseInt(formData.get('price_cents') as string, 10)
    const categoryId = formData.get('category_id') as string | null
    const sizesRaw = formData.get('sizes') as string
    const colorsRaw = formData.get('colors') as string
    const files = formData.getAll('images') as File[]
    const imageColors = formData.getAll('image_colors') as string[]

    if (!name || !priceCents) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

    let sizes: string[] = []
    try { sizes = sizesRaw ? JSON.parse(sizesRaw) : [] } catch { sizes = [] }

    let colors: { name: string; hex: string; slug: string }[] = []
    try { colors = colorsRaw ? JSON.parse(colorsRaw) : [] } catch { colors = [] }

    if (colors.length === 0) {
      return NextResponse.json({ error: 'At least one color is required' }, { status: 400 })
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    let uploadedUrls: string[] = []
    if (files.length > 0) {
      try {
        uploadedUrls = await uploadProductImages(files)
      } catch (uploadErr) {
        return NextResponse.json({
          error: `Image upload failed: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown error'}. Make sure the "product-images" bucket exists in Supabase Storage.`,
        }, { status: 500 })
      }
    }

    const images = uploadedUrls.map((url, i) => ({
      url,
      color: imageColors[i] ?? colors[0]?.slug ?? 'default',
    }))

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        description: description ?? '',
        materials: materials ?? '',
        price_cents: priceCents,
        category_id: categoryId || null,
        sizes,
        colors,
        images,
        in_stock: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Database insert failed: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    console.error('Admin create product error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!checkAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const parsed = DeleteProductSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 })
    }
    const { id } = parsed.data

    const supabase = createAdminClient()
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
