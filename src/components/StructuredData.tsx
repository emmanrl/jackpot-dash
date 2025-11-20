import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";

export const StructuredData = () => {
  const [jackpots, setJackpots] = useState<any[]>([]);

  useEffect(() => {
    const fetchJackpots = async () => {
      const { data } = await supabase
        .from("jackpots")
        .select("*")
        .eq("status", "active")
        .order("prize_pool", { ascending: false })
        .limit(10);
      
      if (data) setJackpots(data);
    };

    fetchJackpots();
  }, []);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LuckyWin",
    "url": "https://luckywin.name.ng",
    "logo": "https://luckywin.name.ng/og-image.jpg",
    "description": "Nigeria's premier online lottery platform. Win big with hourly, daily, weekly, and monthly jackpots.",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "url": "https://luckywin.name.ng/contact"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "LuckyWin",
    "url": "https://luckywin.name.ng",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://luckywin.name.ng/dashboard?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const jackpotsListSchema = jackpots.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Active Jackpots",
    "description": "Current active lottery jackpots on LuckyWin",
    "itemListElement": jackpots.map((jackpot, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": jackpot.name,
        "description": jackpot.description || `${jackpot.frequency} lottery jackpot`,
        "image": jackpot.background_image_url || "https://luckywin.name.ng/og-image.jpg",
        "offers": {
          "@type": "Offer",
          "price": jackpot.ticket_price,
          "priceCurrency": "NGN",
          "availability": "https://schema.org/InStock",
          "url": "https://luckywin.name.ng/dashboard",
          "priceValidUntil": jackpot.next_draw || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        "aggregateRating": {
          "@type": "AggregateOffer",
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": jackpot.prize_pool,
            "priceCurrency": "NGN"
          }
        }
      }
    }))
  } : null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      {jackpotsListSchema && (
        <script type="application/ld+json">
          {JSON.stringify(jackpotsListSchema)}
        </script>
      )}
    </Helmet>
  );
};
