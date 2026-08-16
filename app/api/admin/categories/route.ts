import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const CategoryNameSchema = z.object({
  name: z.string().trim().min(1).max(100),
})

const CategoryIdSchema = z.object({
  id: z.string().uuid(),
})

export async function GET() {
  try {
    const { userId } = await auth()
    const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID
    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const { data: categories } = await supabase.from('categories').select('*').order('name')

    const { data: counts } = await supabase
      .from('products')
      .select('category_id')

    const countMap = new Map<string, number>()
    if (counts) {
      for (const row of counts) {
        if (row.category_id) {
          countMap.set(row.category_id, (countMap.get(row.category_id) ?? 0) + 1)
        }
      }
    }

    const mapped = (categories ?? []).map((c) => ({
      ...c,
      product_count: countMap.get(c.id) ?? 0,
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

    const parsed = CategoryNameSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    const { name } = parsed.data

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: name.trim(), slug })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID
    if (!userId || userId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const parsed = CategoryIdSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Category id is required' }, { status: 400 })
    }
    const { id } = parsed.data

    const supabase = createAdminClient()

    const { error: updateError } = await supabase
      .from('products')
      .update({ category_id: null })
      .eq('category_id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
