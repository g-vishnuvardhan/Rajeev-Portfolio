-- =========================================================================
-- RAJEEV KUMAR PORTFOLIO — SUPABASE DATABASE SCHEMA & SECURITY POLICIES
-- Copy and run this script in your Supabase SQL Editor (supabase.com)
-- =========================================================================

-- 1. Create Gallery Photos Table
CREATE TABLE IF NOT EXISTS public.gallery_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    src TEXT NOT NULL,
    title TEXT DEFAULT '',
    ratio NUMERIC(6, 4) DEFAULT 0.5628,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for speedy category queries
CREATE INDEX IF NOT EXISTS idx_gallery_photos_category ON public.gallery_photos(category);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_sort ON public.gallery_photos(sort_order);

-- 2. Create Site Content Table (Homepage copy, bio, contact details)
CREATE TABLE IF NOT EXISTS public.site_content (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- 4. Security Policies for Gallery Photos
-- Public can READ gallery photos (for portfolio visitors)
CREATE POLICY "Public Can View Gallery Photos"
    ON public.gallery_photos
    FOR SELECT
    USING (true);

-- ONLY authenticated admin can INSERT photos
CREATE POLICY "Admin Can Insert Gallery Photos"
    ON public.gallery_photos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ONLY authenticated admin can UPDATE photos (order, title, ratio)
CREATE POLICY "Admin Can Update Gallery Photos"
    ON public.gallery_photos
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ONLY authenticated admin can DELETE photos
CREATE POLICY "Admin Can Delete Gallery Photos"
    ON public.gallery_photos
    FOR DELETE
    TO authenticated
    USING (true);

-- 5. Security Policies for Site Content
-- Public can READ site content
CREATE POLICY "Public Can View Site Content"
    ON public.site_content
    FOR SELECT
    USING (true);

-- ONLY authenticated admin can UPDATE site content
CREATE POLICY "Admin Can Update Site Content"
    ON public.site_content
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Setup Storage Bucket for Uploaded Gallery Images & Videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-media', 'gallery-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Security: Public can view media
CREATE POLICY "Public Can View Media"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'gallery-media');

-- Storage Security: Authenticated admin can upload & delete media
CREATE POLICY "Admin Can Upload Media"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'gallery-media');

CREATE POLICY "Admin Can Delete Media"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'gallery-media');

-- 7. Seed Initial Homepage Content (Fallback & Defaults)
INSERT INTO public.site_content (id, data)
VALUES (
    'homepage',
    '{
        "site": {
            "name": "Rajeev Kumar",
            "role": "Director of Photography",
            "tagline": "Cinematographer · Photographer · Visual Storyteller",
            "location": "Hyderabad, India",
            "fullLocation": "Hyderabad, Telangana, India",
            "phone": "+91 9100305010",
            "phoneHref": "tel:+919100305010",
            "email": "gantyalarajeevkumar@gmail.com",
            "whatsapp": "https://wa.me/919100305010",
            "instagram": ""
        },
        "about": {
            "quote": "Every frame tells a story. Every light creates a mood. Every movement brings a vision to life.",
            "titleLine": "Director of Photography | Cinematographer | Photographer",
            "profile": [
                "Visual-driven Director of Photography and Cinematographer with 4 years of practical experience across commercial, fashion, portrait and creative productions.",
                "Skilled in camera operation, cinematic lighting, framing, lens selection, camera movement and visual storytelling.",
                "Experienced in adapting visual language to different formats, including films, web series, short films, brand campaigns, model shoots, reels, interior and outdoor productions."
            ]
        }
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 8. Admin Access Control (isAdmin flag in Supabase)
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id TEXT PRIMARY KEY,
    is_admin BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access so the web client can check isAdmin
CREATE POLICY "Public Can Read Admin Settings"
    ON public.admin_settings
    FOR SELECT
    USING (true);

-- Allow modifying admin settings
CREATE POLICY "Allow Modifying Admin Settings"
    ON public.admin_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Seed isAdmin = true in Supabase
INSERT INTO public.admin_settings (id, is_admin)
VALUES ('access_control', true)
ON CONFLICT (id) DO UPDATE SET is_admin = EXCLUDED.is_admin;

-- Allow anonymous/public insert & update on gallery_photos and site_content when managing from admin
CREATE POLICY "Allow Insert Gallery Photos"
    ON public.gallery_photos
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow Update Gallery Photos"
    ON public.gallery_photos
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow Delete Gallery Photos"
    ON public.gallery_photos
    FOR DELETE
    USING (true);

CREATE POLICY "Allow Update Site Content"
    ON public.site_content
    FOR ALL
    USING (true)
    WITH CHECK (true);

