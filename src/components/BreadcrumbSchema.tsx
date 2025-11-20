import { Helmet } from "react-helmet";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps) => {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
};

// Helper function to generate breadcrumbs based on current path
export const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const baseUrl = "https://luckywin.name.ng";
  const paths = pathname.split("/").filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { name: "Home", url: baseUrl }
  ];

  let currentPath = "";
  
  const pathNames: Record<string, string> = {
    "dashboard": "Dashboard",
    "auth": "Sign In",
    "about": "About Us",
    "how-it-works": "How It Works",
    "winners": "Winners Gallery",
    "leaderboard": "Leaderboard",
    "faq": "FAQ",
    "terms": "Terms of Service",
    "privacy": "Privacy Policy",
    "fair-play": "Fair Play Policy",
    "contact": "Contact Us",
    "profile": "Profile",
    "settings": "Settings",
    "withdrawal": "Withdrawal",
    "transaction-history": "Transaction History",
    "admin": "Admin Panel",
    "complete-profile": "Complete Profile",
    "edit-profile": "Edit Profile",
  };

  paths.forEach((path) => {
    currentPath += `/${path}`;
    const name = pathNames[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
    breadcrumbs.push({
      name,
      url: `${baseUrl}${currentPath}`,
    });
  });

  return breadcrumbs;
};
