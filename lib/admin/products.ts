'use server'

import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadProductImages } from '@/lib/supabase/storage'
import { revalidatePath } from 'next/cache'
import { escapeLike } from '@/lib/utils'
import type { AdminProduct, ProductStatus } from './types'

async function checkAdmin() {
  await requireAdmin()
}

async function ensureUniqueSlug(supabase: ReturnType<typeof createAdminClient>, baseSlug: string, excludeId?: string): Promise<string> {
  const { data } = await supabase
    .from('products')
    .select('slug')
    .ilike('slug', `${baseSlug}%`)
    .limit(100)
  const existing = new Set((data ?? []).map((p: { slug: string }) => p.slug).filter((s: string) => s !== excludeId))
  if (!existing.has(baseSlug)) return baseSlug
  let i = 2
  while (existing.has(`${baseSlug}-${i}`)) i++
  return `${baseSlug}-${i}`
}

export async function getProducts(categoryId?: string, search?: string, inStock?: boolean): Promise<AdminProduct[]> {
  await checkAdmin()
  const supabase = createAdminClient()

  let q = supabase.from('products').select('*, categories(name), product_variants(*)')

  if (categoryId) q = q.contains('category_ids', [categoryId])
  if (search) q = q.ilike('name', `%${escapeLike(search)}%`)
  if (inStock !== undefined) q = q.eq('in_stock', inStock)

  const { data } = await q.order('created_at', { ascending: false })

  return ((data ?? []) as any[]).map((p: any) => ({
    ...p,
    status: p.status ?? 'active',
    category_name: p.categories?.name ?? null,
    category_ids: p.category_ids ?? (p.category_id ? [p.category_id] : []),
    categories: undefined,
    product_variants: undefined,
    variants: p.product_variants ?? [],
  }))
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(name), product_variants(*)')
    .eq('id', id)
    .single()

  if (!data) return null

  const p = data as any
  return {
    ...p,
    category_name: p.categories?.name ?? null,
    category_ids: p.category_ids ?? (p.category_id ? [p.category_id] : []),
    variants: p.product_variants ?? [],
  }
}

export async function createProduct(formData: FormData) {
  await checkAdmin()

  const name = formData.get('name') as string
  const priceCents = parseInt(formData.get('price_cents') as string, 10)
  if (!name || !priceCents) return { error: 'Name and price required' }

  const sizes: string[] = JSON.parse((formData.get('sizes') as string) || '[]')
  const colors: { name: string; hex: string; slug: string }[] = JSON.parse((formData.get('colors') as string) || '[]')
  const imageColors: string[] = JSON.parse((formData.get('image_colors') as string) || '[]')
  const files = formData.getAll('images') as File[]
  const variants: any[] = JSON.parse((formData.get('variants') as string) || '[]')
  const existingImages: { url: string; color: string }[] = JSON.parse((formData.get('existing_images') as string) || '[]')

  const images: { url: string; color: string }[] = [...existingImages]

  if (files.length > 0) {
    try {
      const urls = await uploadProductImages(files)
      urls.forEach((url, i) => {
        images.push({ url, color: imageColors[i] ?? colors[0]?.slug ?? 'default' })
      })
    } catch (e: any) {
      return { error: `Image upload failed: ${e.message}` }
    }
  }

  const hasVariants = variants.length > 0
  const derivedStockQty = hasVariants
    ? variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
    : parseInt(formData.get('stock_quantity') as string) || 0
  const derivedInStock = hasVariants
    ? variants.some((v) => (v.stock_quantity || 0) > 0)
    : formData.get('in_stock') !== 'false'

  const supabase = createAdminClient()
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const slug = await ensureUniqueSlug(supabase, baseSlug)

  const categoryId = (formData.get('category_id') as string) || null
  const categoryIdsStr = (formData.get('category_ids') as string) || ''
  const categoryIds: string[] = categoryIdsStr ? JSON.parse(categoryIdsStr) : (categoryId ? [categoryId] : [])

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name,
      slug,
      description: (formData.get('description') as string) ?? '',
      materials: (formData.get('materials') as string) ?? '',
      price_cents: priceCents,
      compare_at_price_cents: formData.get('compare_at_price_cents') ? parseInt(formData.get('compare_at_price_cents') as string) : null,
      sku: (formData.get('sku') as string) ?? '',
      stock_quantity: derivedStockQty,
      seo_title: (formData.get('seo_title') as string) ?? '',
      seo_description: (formData.get('seo_description') as string) ?? '',
      category_id: categoryId,
      category_ids: categoryIds,
      sizes,
      colors,
      images,
      in_stock: derivedInStock,
      status: (formData.get('status') as ProductStatus) ?? 'active',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  if (hasVariants) {
    const { error: vErr } = await supabase.from('product_variants').insert(
      variants.map((v) => ({ ...v, product_id: product.id }))
    )
    if (vErr) return { error: `Product created but variants failed: ${vErr.message}` }
  }

  revalidatePath('/admin/products')
  return { product }
}

export async function updateProduct(id: string, formData: FormData) {
  await checkAdmin()

  const sizes: string[] = JSON.parse((formData.get('sizes') as string) || '[]')
  const colors: { name: string; hex: string; slug: string }[] = JSON.parse((formData.get('colors') as string) || '[]')
  const imageColors: string[] = JSON.parse((formData.get('image_colors') as string) || '[]')
  const files = formData.getAll('images') as File[]
  const variants: any[] = JSON.parse((formData.get('variants') as string) || '[]')
  const existingImages: { url: string; color: string }[] = JSON.parse((formData.get('existing_images') as string) || '[]')

  const images = [...existingImages]

  if (files.length > 0) {
    try {
      const urls = await uploadProductImages(files)
      urls.forEach((url, i) => {
        images.push({ url, color: imageColors[i] ?? colors[0]?.slug ?? 'default' })
      })
    } catch (e: any) {
      return { error: `Image upload failed: ${e.message}` }
    }
  }

  const hasVariants = variants.length > 0
  const derivedStockQty = hasVariants
    ? variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
    : parseInt(formData.get('stock_quantity') as string) || 0
  const derivedInStock = hasVariants
    ? variants.some((v) => (v.stock_quantity || 0) > 0)
    : formData.get('in_stock') !== 'false'

  const supabase = createAdminClient()

  const name = formData.get('name') as string
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const slug = await ensureUniqueSlug(supabase, baseSlug, id)
  const categoryId = (formData.get('category_id') as string) || null
  const categoryIdsStr = (formData.get('category_ids') as string) || ''
  const categoryIds: string[] = categoryIdsStr ? JSON.parse(categoryIdsStr) : (categoryId ? [categoryId] : [])

  const { error } = await supabase
    .from('products')
    .update({
      name,
      slug,
      description: (formData.get('description') as string) ?? '',
      materials: (formData.get('materials') as string) ?? '',
      price_cents: parseInt(formData.get('price_cents') as string, 10),
      compare_at_price_cents: formData.get('compare_at_price_cents') ? parseInt(formData.get('compare_at_price_cents') as string) : null,
      sku: (formData.get('sku') as string) ?? '',
      stock_quantity: derivedStockQty,
      seo_title: (formData.get('seo_title') as string) ?? '',
      seo_description: (formData.get('seo_description') as string) ?? '',
      category_id: categoryId,
      category_ids: categoryIds,
      sizes,
      colors,
      images,
      in_stock: derivedInStock,
      status: (formData.get('status') as ProductStatus) ?? 'active',
    })
    .eq('id', id)

  if (error) return { error: error.message }

  const { error: delVarErr } = await supabase.from('product_variants').delete().eq('product_id', id)
  if (delVarErr) return { error: `Failed to delete variants: ${delVarErr.message}` }
  if (hasVariants) {
    const { error: insVarErr } = await supabase.from('product_variants').insert(variants.map((v) => ({ ...v, product_id: id })))
    if (insVarErr) return { error: `Failed to insert variants: ${insVarErr.message}` }
  }

  revalidatePath('/admin/products')
  return { success: true }
}

async function deleteProductImages(supabase: any, images: { url: string }[]) {
  const paths = images
    .map((img) => {
      const urlParts = img.url?.split('/')
      return urlParts ? urlParts[urlParts.length - 1] : null
    })
    .filter((p): p is string => !!p)
  if (paths.length > 0) {
    await supabase.storage.from('product-images').remove(paths)
  }
}

export async function deleteProduct(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data: product } = await supabase.from('products').select('images').eq('id', id).single()
  if (product?.images) await deleteProductImages(supabase, product.images as { url: string }[])
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { success: true }
}

export async function bulkDeleteProducts(ids: string[]) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data: products } = await supabase.from('products').select('id, images').in('id', ids)
  for (const p of products ?? []) {
    if (p.images) await deleteProductImages(supabase, p.images as { url: string }[])
  }
  const { error } = await supabase.from('products').delete().in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { success: true }
}

export async function bulkUpdateProducts(ids: string[], data: { status?: ProductStatus }) {
  await checkAdmin()
  const supabase = createAdminClient()
  const updateData: Record<string, string> = {}
  if (data.status) updateData.status = data.status
  const { error } = await supabase.from('products').update(updateData).in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { success: true }
}

export async function duplicateProduct(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data: original } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('id', id)
    .single()
  if (!original) return { error: 'Product not found' }
  const baseSlug = original.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const slug = await ensureUniqueSlug(supabase, baseSlug)
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: `${original.name} (Copy)`,
      slug,
      description: original.description,
      materials: original.materials,
      price_cents: original.price_cents,
      compare_at_price_cents: original.compare_at_price_cents,
      sku: original.sku ? `${original.sku}-COPY` : '',
      stock_quantity: original.stock_quantity,
      seo_title: original.seo_title,
      seo_description: original.seo_description,
      category_id: original.category_id,
      sizes: original.sizes,
      colors: original.colors,
      images: original.images,
      in_stock: original.in_stock,
      status: 'draft',
    })
    .select()
    .single()
  if (error) return { error: error.message }
  if (original.product_variants?.length > 0) {
    const { error: vErr } = await supabase.from('product_variants').insert(
      original.product_variants.map((v: any) => ({
        product_id: product.id,
        sku: v.sku ? `${v.sku}-COPY` : '',
        size: v.size,
        color_slug: v.color_slug,
        price_cents: v.price_cents,
        stock_quantity: v.stock_quantity,
      }))
    )
    if (vErr) console.error('Variant duplicate error:', vErr)
  }
  revalidatePath('/admin/products')
  return { product }
}

export async function quickUpdateProduct(id: string, data: { name?: string; price_cents?: number; status?: ProductStatus; category_id?: string | null; category_ids?: string[]; stock_quantity?: number; in_stock?: boolean }) {
  await checkAdmin()
  const supabase = createAdminClient()
  const updateData: Record<string, string | number | null | string[] | boolean> = {}
  if (data.name !== undefined) {
    updateData.name = data.name
    const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    updateData.slug = await ensureUniqueSlug(supabase, baseSlug, id)
  }
  if (data.price_cents !== undefined) updateData.price_cents = data.price_cents
  if (data.status !== undefined) updateData.status = data.status
  if (data.category_id !== undefined) updateData.category_id = data.category_id
  if (data.category_ids !== undefined) updateData.category_ids = data.category_ids
  if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity
  if (data.in_stock !== undefined) updateData.in_stock = data.in_stock
  const { error } = await supabase.from('products').update(updateData).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  revalidatePath('/')
  return { success: true }
}
