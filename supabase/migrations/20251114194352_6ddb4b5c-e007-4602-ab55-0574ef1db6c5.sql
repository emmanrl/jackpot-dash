-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create slider_images table for homepage carousel
CREATE TABLE IF NOT EXISTS public.slider_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.slider_images ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active slider images
CREATE POLICY "Anyone can view active slider images"
ON public.slider_images
FOR SELECT
USING (is_active = true);

-- Only admins can manage slider images (insert, update, delete)
CREATE POLICY "Admins can manage slider images"
ON public.slider_images
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_slider_images_updated_at
BEFORE UPDATE ON public.slider_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();