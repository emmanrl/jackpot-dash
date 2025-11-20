import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Static pages
    const baseUrl = 'https://luckywin.name.ng';
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/auth', priority: '0.8', changefreq: 'monthly' },
      { loc: '/dashboard', priority: '0.9', changefreq: 'daily' },
      { loc: '/about', priority: '0.7', changefreq: 'monthly' },
      { loc: '/how-it-works', priority: '0.8', changefreq: 'monthly' },
      { loc: '/winners', priority: '0.7', changefreq: 'daily' },
      { loc: '/leaderboard', priority: '0.7', changefreq: 'daily' },
      { loc: '/faq', priority: '0.6', changefreq: 'monthly' },
      { loc: '/terms', priority: '0.5', changefreq: 'yearly' },
      { loc: '/privacy', priority: '0.5', changefreq: 'yearly' },
      { loc: '/fair-play', priority: '0.5', changefreq: 'yearly' },
      { loc: '/contact', priority: '0.6', changefreq: 'monthly' },
    ];

    // Fetch active jackpots
    const { data: jackpots } = await supabase
      .from('jackpots')
      .select('id, name, updated_at, frequency')
      .eq('status', 'active')
      .order('prize_pool', { ascending: false });

    // Fetch recent winners
    const { data: winners } = await supabase
      .from('winners')
      .select('user_id, claimed_at')
      .order('claimed_at', { ascending: false })
      .limit(100);

    const today = new Date().toISOString().split('T')[0];

    // Build XML sitemap
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach(page => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${baseUrl}${page.loc}</loc>\n`;
      sitemap += `    <lastmod>${today}</lastmod>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${page.priority}</priority>\n`;
      sitemap += '  </url>\n';
    });

    // Add jackpot pages (conceptual - if you had individual jackpot pages)
    if (jackpots) {
      jackpots.forEach(jackpot => {
        const lastmod = jackpot.updated_at 
          ? new Date(jackpot.updated_at).toISOString().split('T')[0]
          : today;
        
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/dashboard?jackpot=${jackpot.id}</loc>\n`;
        sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
        sitemap += `    <changefreq>daily</changefreq>\n`;
        sitemap += `    <priority>0.8</priority>\n`;
        sitemap += '  </url>\n';
      });
    }

    // Add winner profile pages (if public)
    if (winners) {
      const uniqueUsers = [...new Set(winners.map(w => w.user_id))];
      uniqueUsers.slice(0, 50).forEach(userId => {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/user/${userId}</loc>\n`;
        sitemap += `    <lastmod>${today}</lastmod>\n`;
        sitemap += `    <changefreq>weekly</changefreq>\n`;
        sitemap += `    <priority>0.5</priority>\n`;
        sitemap += '  </url>\n';
      });
    }

    sitemap += '</urlset>';

    return new Response(sitemap, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
