-- Run this in Supabase SQL Editor to enable multi-category support
-- Migration: add category_ids column to products table

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_ids JSONB DEFAULT '[]'::jsonb;

-- Migrate existing products: copy their single category_id into the array
UPDATE products 
SET category_ids = jsonb_build_array(category_id) 
WHERE category_id IS NOT NULL 
  AND (category_ids IS NULL OR category_ids = '[]'::jsonb);

-- Create index for JSONB category queries
CREATE INDEX IF NOT EXISTS idx_products_category_ids ON products USING GIN (category_ids);
