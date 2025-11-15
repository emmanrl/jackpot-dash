import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface SliderImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  order_index: number;
}

export const ImageSlider = () => {
  const [images, setImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

  useEffect(() => {
    fetchSliderImages();
  }, []);

  const fetchSliderImages = async () => {
    try {
      const { data, error } = await supabase
        .from("slider_images")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (!error && data) {
        setImages(data);
      }
    } catch (err) {
      console.error("Error fetching slider images:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || images.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[plugin.current]}
        className="w-full"
      >
        <CarouselContent>
          {images.map((image) => (
            <CarouselItem key={image.id}>
              <div className="relative aspect-video md:aspect-[21/9] overflow-hidden">
                <img
                  src={image.image_url}
                  alt={image.title || "Slider image"}
                  className="w-full h-full object-cover"
                />
                {(image.title || image.description) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent flex items-end p-4 md:p-8">
                    <div className="text-foreground">
                      {image.title && (
                        <h3 className="text-xl md:text-3xl font-bold mb-2">{image.title}</h3>
                      )}
                      {image.description && (
                        <p className="text-sm md:text-lg text-muted-foreground">{image.description}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </Carousel>
    </div>
  );
};
