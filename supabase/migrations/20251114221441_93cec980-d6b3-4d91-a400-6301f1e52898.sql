-- Create storage bucket for slider images
INSERT INTO storage.buckets (id, name, public)
VALUES ('slider-images', 'slider-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for slider images bucket
CREATE POLICY "Public can view slider images"
ON storage.objects FOR SELECT
USING (bucket_id = 'slider-images');

CREATE POLICY "Admins can upload slider images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'slider-images' 
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
);

CREATE POLICY "Admins can delete slider images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'slider-images'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
);