-- Add background_image_url column to jackpots table
ALTER TABLE public.jackpots 
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Create storage bucket for jackpot images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('jackpot-images', 'jackpot-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for jackpot images
CREATE POLICY "Anyone can view jackpot images"
ON storage.objects FOR SELECT
USING (bucket_id = 'jackpot-images');

CREATE POLICY "Admins can upload jackpot images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'jackpot-images' 
  AND (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

CREATE POLICY "Admins can update jackpot images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'jackpot-images'
  AND (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

CREATE POLICY "Admins can delete jackpot images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'jackpot-images'
  AND (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);