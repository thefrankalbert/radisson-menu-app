-- =====================================================
-- Migration: Create ads table and storage bucket
-- Date: 2026-02-01
-- =====================================================

-- 1. Create the ads table if it doesn't exist
CREATE TABLE IF NOT EXISTS ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    link TEXT,
    sort_order INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(active);
CREATE INDEX IF NOT EXISTS idx_ads_sort_order ON ads(sort_order);

-- Enable RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (ads are public)
DROP POLICY IF EXISTS "Ads are publicly readable" ON ads;
CREATE POLICY "Ads are publicly readable" ON ads
    FOR SELECT USING (true);

-- Create policy for admin/authenticated insert
DROP POLICY IF EXISTS "Authenticated users can insert ads" ON ads;
CREATE POLICY "Authenticated users can insert ads" ON ads
    FOR INSERT TO authenticated WITH CHECK (true);

-- Create policy for admin/authenticated update
DROP POLICY IF EXISTS "Authenticated users can update ads" ON ads;
CREATE POLICY "Authenticated users can update ads" ON ads
    FOR UPDATE TO authenticated USING (true);

-- Create policy for admin/authenticated delete
DROP POLICY IF EXISTS "Authenticated users can delete ads" ON ads;
CREATE POLICY "Authenticated users can delete ads" ON ads
    FOR DELETE TO authenticated USING (true);

-- =====================================================
-- 2. Storage Bucket (Run this in Supabase Dashboard > SQL Editor)
-- =====================================================

-- Create the images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'images',
    'images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880;

-- Storage policies for the images bucket
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
CREATE POLICY "Authenticated upload" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Authenticated update" ON storage.objects;
CREATE POLICY "Authenticated update" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Authenticated delete" ON storage.objects;
CREATE POLICY "Authenticated delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'images');

-- =====================================================
-- Done! The ads table and images bucket are now ready.
-- =====================================================
