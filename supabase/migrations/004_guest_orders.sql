-- Allow guest orders (user_id nullable)
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
