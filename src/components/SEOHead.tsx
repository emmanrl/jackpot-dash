import { Helmet } from "react-helmet";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
  noFollow?: boolean;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export const SEOHead = ({
  title = "LuckyWin - Nigeria's Premier Online Lottery Platform",
  description = "Win big with LuckyWin! Play hourly, daily, weekly, and monthly jackpots. Nigeria's most trusted online lottery platform with instant payouts.",
  image = "https://luckywin.name.ng/og-image.jpg",
  url = "https://luckywin.name.ng",
  type = "website",
  noIndex = false,
  noFollow = false,
  author,
  publishedTime,
  modifiedTime,
}: SEOHeadProps) => {
  const robots = [];
  if (noIndex) robots.push("noindex");
  if (noFollow) robots.push("nofollow");
  if (!noIndex && !noFollow) robots.push("index", "follow");

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {robots.length > 0 && <meta name="robots" content={robots.join(", ")} />}
      <link rel="canonical" href={url} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="LuckyWin" />
      <meta property="og:locale" content="en_NG" />

      {/* Article specific meta tags */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@LuckyWinNG" />
      <meta name="twitter:creator" content="@LuckyWinNG" />

      {/* Additional Meta Tags */}
      <meta name="geo.region" content="NG" />
      <meta name="geo.placename" content="Nigeria" />
      <meta name="language" content="English" />
    </Helmet>
  );
};
