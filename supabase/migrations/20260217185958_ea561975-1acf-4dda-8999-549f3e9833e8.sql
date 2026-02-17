
-- Create pixels table
CREATE TABLE public.pixels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  pixel_type TEXT NOT NULL DEFAULT 'meta',
  lead_rule TEXT NOT NULL DEFAULT 'disabled',
  add_to_cart_rule TEXT NOT NULL DEFAULT 'disabled',
  initiate_checkout_rule TEXT NOT NULL DEFAULT 'enabled',
  checkout_detection_rule TEXT NOT NULL DEFAULT 'contains_text',
  checkout_button_text TEXT DEFAULT '',
  purchase_send_config TEXT NOT NULL DEFAULT 'approved_only',
  purchase_value_type TEXT NOT NULL DEFAULT 'sale_value',
  purchase_product TEXT NOT NULL DEFAULT 'any',
  ip_config TEXT NOT NULL DEFAULT 'ipv6_ipv4',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pixel_meta_ids table for multiple meta pixel IDs per pixel
CREATE TABLE public.pixel_meta_ids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pixel_id UUID NOT NULL REFERENCES public.pixels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  meta_pixel_id TEXT NOT NULL,
  token TEXT DEFAULT '',
  apelido TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_meta_ids ENABLE ROW LEVEL SECURITY;

-- Pixels policies
CREATE POLICY "Users can view their own pixels" ON public.pixels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pixels" ON public.pixels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pixels" ON public.pixels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pixels" ON public.pixels FOR DELETE USING (auth.uid() = user_id);

-- Pixel meta IDs policies
CREATE POLICY "Users can view their own pixel meta ids" ON public.pixel_meta_ids FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pixel meta ids" ON public.pixel_meta_ids FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pixel meta ids" ON public.pixel_meta_ids FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pixel meta ids" ON public.pixel_meta_ids FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_pixels_updated_at BEFORE UPDATE ON public.pixels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
