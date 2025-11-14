# Deployment Guide

This guide provides step-by-step instructions for deploying your JackpotWin lottery platform to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Deployment](#frontend-deployment)
3. [Backend Setup](#backend-setup)
4. [Environment Configuration](#environment-configuration)
5. [DNS & Domain Setup](#dns--domain-setup)
6. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Git repository with your code
- ✅ Node.js 18+ installed locally (for testing)
- ✅ Domain name (optional but recommended)
- ✅ Payment gateway accounts (Paystack/Remita)
- ✅ Email service account (Resend)
- ✅ Supabase account (for backend) OR self-hosted PostgreSQL

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

**Pros:** Zero-config, automatic SSL, global CDN, preview deployments
**Cost:** Free tier available (Hobby plan)

#### Steps:

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Configure Environment Variables**
   In Vercel dashboard, add:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your site is live at `your-project.vercel.app`

5. **Custom Domain (Optional)**
   - Go to Settings → Domains
   - Add your domain (e.g., `jackpotwin.com`)
   - Update DNS records as instructed
   - SSL certificate is automatic

---

### Option 2: Netlify

**Pros:** Simple deployment, good free tier, automatic builds
**Cost:** Free tier available

#### Steps:

1. **Connect Repository**
   - Visit [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

3. **Environment Variables**
   Add in Site Settings → Environment Variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

4. **Deploy**
   - Click "Deploy site"
   - Site is live at `random-name.netlify.app`

5. **Custom Domain**
   - Go to Domain Settings
   - Add custom domain
   - Configure DNS

---

### Option 3: AWS Amplify

**Pros:** AWS integration, scalable, good for enterprise
**Cost:** Pay-as-you-go

#### Steps:

1. **Create Amplify App**
   - Log in to AWS Console
   - Navigate to AWS Amplify
   - Click "New app" → "Host web app"
   - Connect GitHub repository

2. **Build Settings**
   Auto-detected for Vite, or use:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Environment Variables**
   Add in App Settings → Environment Variables

4. **Deploy**
   - Save and deploy
   - Site is live at AWS-provided URL

---

## Backend Setup

### Option 1: Keep Supabase (Recommended)

Your project already uses Supabase. To migrate to production:

#### 1. Create Production Supabase Project

```bash
# Visit https://supabase.com/dashboard
# Click "New Project"
# Choose region closest to your users
# Save your project URL and keys
```

#### 2. Export Your Database

```bash
# From your development project, export schema:
# Go to Database → Backups → Export schema
# Download the SQL file
```

#### 3. Import to Production

```bash
# In production project:
# Go to SQL Editor
# Paste and run your schema SQL
# Or use Supabase CLI:
npx supabase db push
```

#### 4. Migrate Data

```bash
# Export data from dev project
# Tables → Export as CSV for each table
# Import to production via SQL Editor or Table Editor
```

#### 5. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to production project
supabase link --project-ref your-production-project-id

# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy send-notification
```

#### 6. Configure Secrets

```bash
# Set secrets for production
supabase secrets set RESEND_API_KEY=your-key
supabase secrets set PAYSTACK_SECRET_KEY=your-key
supabase secrets set PAYSTACK_PUBLIC_KEY=your-key
supabase secrets set REMITA_MERCHANT_ID=your-id
supabase secrets set REMITA_API_KEY=your-key
supabase secrets set REMITA_PUBLIC_KEY=your-key
```

#### 7. Update Frontend Environment Variables

Update your Vercel/Netlify environment variables with production Supabase credentials.

---

### Option 2: Self-Host Everything

⚠️ **Advanced Option** - Only if you need full control

#### Requirements:
- PostgreSQL 14+
- Linux server (Ubuntu recommended)
- Deno runtime (for edge functions)
- Nginx (reverse proxy)
- SSL certificate (Let's Encrypt)

#### Steps:

1. **Setup PostgreSQL**
   ```bash
   # Install PostgreSQL
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # Create database
   sudo -u postgres createdb jackpotwin
   
   # Import schema
   psql -U postgres -d jackpotwin < schema.sql
   ```

2. **Setup Backend API**
   - Convert edge functions to Node.js/Express
   - Set up REST endpoints
   - Configure CORS

3. **Setup Authentication**
   - Implement JWT authentication
   - Email verification system
   - Password reset flow

4. **Setup File Storage**
   - Use AWS S3, or
   - Use local storage with Nginx

5. **Setup Cron Jobs**
   ```bash
   # Add to crontab for auto-draws
   0 * * * * curl https://yourapi.com/process-auto-draw
   ```

This option requires significant DevOps experience and is **not recommended** unless you have specific requirements.

---

## Environment Configuration

### Required Environment Variables

#### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

#### Backend (Supabase Secrets)
```bash
RESEND_API_KEY=re_xxxxxxxxxxxx          # Email sending
PAYSTACK_SECRET_KEY=sk_live_xxxxx       # Paystack payments
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx       # Paystack frontend
REMITA_MERCHANT_ID=xxxxxxxxxxxxx        # Remita merchant ID
REMITA_API_KEY=xxxxxxxxxxxxx            # Remita API key
REMITA_PUBLIC_KEY=xxxxxxxxxxxxx         # Remita public key
```

### Security Best Practices

1. **Never commit secrets to Git**
   - Use `.gitignore` to exclude `.env`
   - Store secrets in platform secret managers

2. **Use different keys for production**
   - Don't use test/sandbox keys in production
   - Use live payment gateway keys

3. **Enable RLS (Row Level Security)**
   - Already configured in your database
   - Verify policies before going live

4. **Configure CORS properly**
   - Update edge function CORS headers
   - Whitelist your production domain

---

## DNS & Domain Setup

### 1. Purchase Domain
Popular registrars:
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare Registrar

### 2. Configure DNS Records

For Vercel:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

For Netlify:
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: your-site.netlify.app
```

### 3. Email Domain Setup (Resend)

To send emails from your domain:

1. **Add Domain in Resend**
   - Go to [resend.com/domains](https://resend.com/domains)
   - Add your domain (e.g., `jackpotwin.com`)

2. **Add DNS Records**
   Add these records to your DNS:
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [provided by Resend]
   
   Type: TXT
   Name: @
   Value: v=spf1 include:resend.com ~all
   
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

3. **Verify Domain**
   - Wait 24-48 hours for DNS propagation
   - Click "Verify" in Resend dashboard
   - Once verified, you can send from `noreply@yourdomain.com`

4. **Configure in Admin Panel**
   - Log in to your admin panel
   - Go to Site Settings
   - Enter email configuration:
     - From Name: "JackpotWin"
     - From Email: "noreply@jackpotwin.com"
     - Resend API Key: Your API key

---

## Post-Deployment Checklist

### Functionality Tests

- [ ] User registration works
- [ ] Email verification works (if enabled)
- [ ] Login/logout works
- [ ] Password reset works
- [ ] Deposit flow works (test with small amount)
- [ ] Withdrawal request works
- [ ] Ticket purchase works
- [ ] Jackpot draws run automatically
- [ ] Winner notifications sent
- [ ] Admin panel accessible
- [ ] Payment webhooks working

### Performance Tests

- [ ] Page load time < 3 seconds
- [ ] Mobile responsive design
- [ ] Images optimized
- [ ] Database queries optimized
- [ ] CDN configured (if using)

### Security Tests

- [ ] SSL certificate active (HTTPS)
- [ ] RLS policies working
- [ ] Authentication required for protected routes
- [ ] Admin routes only accessible to admins
- [ ] Payment secrets not exposed
- [ ] CORS configured correctly

### SEO & Marketing

- [ ] Add Google Analytics
- [ ] Submit sitemap to Google Search Console
- [ ] Add meta tags for social sharing
- [ ] Configure robots.txt
- [ ] Set up error monitoring (Sentry)

### Legal & Compliance

- [ ] Terms of Service page accessible
- [ ] Privacy Policy page accessible
- [ ] Contact information visible
- [ ] Gambling license (if required by region)
- [ ] Age verification (if required)

### Monitoring Setup

1. **Setup Error Tracking**
   ```bash
   npm install @sentry/react
   # Configure Sentry in your app
   ```

2. **Setup Uptime Monitoring**
   - UptimeRobot (free)
   - Pingdom
   - StatusCake

3. **Setup Performance Monitoring**
   - Google Analytics
   - Vercel Analytics (if using Vercel)
   - Cloudflare Analytics

---

## Troubleshooting

### Common Issues

**Issue: Build fails on Vercel/Netlify**
```
Solution: Check Node version (must be 18+)
- Set Node version in Vercel: Settings → General → Node.js Version
- Set in Netlify: Add .nvmrc file with "18"
```

**Issue: Environment variables not working**
```
Solution: 
1. Make sure variables are prefixed with VITE_
2. Rebuild and redeploy after adding variables
3. Clear cache and redeploy
```

**Issue: CORS errors**
```
Solution: Update edge function CORS headers
- Change '*' to your production domain
- Redeploy edge functions
```

**Issue: Payments not working**
```
Solution:
1. Verify using LIVE keys, not test keys
2. Check webhook URLs are correct
3. Verify payment gateway is enabled in admin
4. Check edge function logs for errors
```

**Issue: Emails not sending**
```
Solution:
1. Verify domain in Resend
2. Check DNS records are correct (wait 24-48hrs)
3. Verify Resend API key is correct
4. Check edge function logs
```

---

## Scaling Considerations

### When Your App Grows

**Database:**
- Upgrade Supabase plan for more storage/bandwidth
- Add database indexes for better performance
- Consider read replicas for high traffic

**Frontend:**
- Enable CDN caching
- Optimize images (WebP format)
- Lazy load components
- Implement code splitting

**Backend:**
- Scale edge functions automatically (Supabase handles this)
- Add rate limiting to prevent abuse
- Implement caching for frequently accessed data

**Monitoring:**
- Set up alerts for downtime
- Monitor database performance
- Track error rates
- Monitor payment success rates

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Resend Docs:** https://resend.com/docs
- **Paystack Docs:** https://paystack.com/docs
- **Community Support:** Your project Discord/Slack

---

## Next Steps

After successful deployment:

1. **Test everything thoroughly** with real transactions
2. **Monitor for 24-48 hours** to catch any issues
3. **Enable error tracking** (Sentry)
4. **Set up backup strategy** (daily database backups)
5. **Document any custom configurations**
6. **Train support staff** on admin panel

🎉 **Congratulations!** Your lottery platform is now live!
