# Migration Checklist

Use this checklist when migrating your JackpotWin platform from development to production or between hosting providers.

## Pre-Migration

### 1. Backup Everything
- [ ] Export all database tables to CSV
- [ ] Download all uploaded images/files from storage
- [ ] Save a copy of all environment variables
- [ ] Export database schema SQL
- [ ] Download edge functions code
- [ ] Save payment gateway configurations
- [ ] Document current DNS settings

### 2. Test Locally
- [ ] Run `npm install` to verify dependencies
- [ ] Run `npm run build` to verify build succeeds
- [ ] Test with production environment variables locally
- [ ] Verify all edge functions work locally

### 3. Prepare New Environment
- [ ] Create new Supabase project (or database)
- [ ] Create hosting account (Vercel/Netlify)
- [ ] Register domain name (if needed)
- [ ] Set up email service (Resend)
- [ ] Obtain production payment gateway keys

---

## Database Migration

### 1. Create New Database
- [ ] Create production Supabase project
- [ ] Note project URL and keys
- [ ] Choose region closest to users
- [ ] Enable daily backups

### 2. Import Schema
- [ ] Open SQL Editor in new project
- [ ] Paste and run schema export
- [ ] Verify all tables created
- [ ] Verify all functions created
- [ ] Verify all triggers created
- [ ] Enable Row Level Security on all tables

### 3. Import Data
For each table:
- [ ] `profiles` - Export/import user profiles
- [ ] `wallets` - Export/import wallet balances
- [ ] `jackpots` - Export/import jackpots
- [ ] `tickets` - Export/import tickets
- [ ] `winners` - Export/import winners
- [ ] `transactions` - Export/import transactions
- [ ] `withdrawal_accounts` - Export/import bank accounts
- [ ] `site_settings` - Export/import site configuration
- [ ] `payment_settings` - Export/import payment configs
- [ ] `bonus_settings` - Export/import bonus configs
- [ ] `user_roles` - Export/import roles
- [ ] `referrals` - Export/import referral data
- [ ] `achievements` - Export/import achievements
- [ ] `notifications` - Optionally export notifications

### 4. Migrate Storage
- [ ] Create storage buckets:
  - [ ] `avatars` (public)
  - [ ] `jackpot-images` (public)
- [ ] Download all files from old storage
- [ ] Upload files to new storage buckets
- [ ] Update file URLs in database if needed
- [ ] Set bucket policies (public/private)

### 5. Configure Auth
- [ ] Enable email provider
- [ ] Enable Google OAuth (if using)
- [ ] Configure email templates
- [ ] Enable auto-confirm for emails (non-production) or disable for production
- [ ] Set site URL
- [ ] Set redirect URLs
- [ ] Configure password requirements

---

## Backend Migration

### 1. Edge Functions Setup
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Login: `supabase login`
- [ ] Link project: `supabase link --project-ref YOUR_PROJECT_ID`

### 2. Deploy Edge Functions
Deploy each function:
- [ ] `approve-transaction`
- [ ] `auto-create-jackpots`
- [ ] `delete-jackpot`
- [ ] `get-banks`
- [ ] `get-payment-providers`
- [ ] `initiate-payment`
- [ ] `paystack-webhook`
- [ ] `process-auto-draw`
- [ ] `process-batch-withdrawal`
- [ ] `process-draw`
- [ ] `process-withdrawal`
- [ ] `purchase-ticket`
- [ ] `send-notification`
- [ ] `send-push-notification`
- [ ] `verify-bank-account`
- [ ] `verify-payment`

Commands:
```bash
# Deploy all at once
supabase functions deploy

# Or deploy individually
supabase functions deploy send-notification
```

### 3. Configure Secrets
Set all required secrets:
```bash
supabase secrets set RESEND_API_KEY=your-key
supabase secrets set PAYSTACK_SECRET_KEY=your-key
supabase secrets set PAYSTACK_PUBLIC_KEY=your-key
supabase secrets set REMITA_MERCHANT_ID=your-id
supabase secrets set REMITA_API_KEY=your-key
supabase secrets set REMITA_PUBLIC_KEY=your-key
```

Verify secrets:
```bash
supabase secrets list
```

### 4. Test Edge Functions
- [ ] Test each function via Supabase dashboard
- [ ] Verify logs show no errors
- [ ] Test with production secrets

---

## Frontend Migration

### 1. Update Code
- [ ] Update environment variables in code
- [ ] Update Supabase client configuration
- [ ] Update API endpoints if changed
- [ ] Update payment keys in code
- [ ] Remove any dev-only code

### 2. Deploy Frontend

#### Vercel:
- [ ] Connect GitHub repository
- [ ] Add environment variables
- [ ] Configure build settings
- [ ] Deploy
- [ ] Verify deployment successful
- [ ] Check for build errors

#### Netlify:
- [ ] Connect GitHub repository
- [ ] Add environment variables
- [ ] Configure build settings
- [ ] Deploy
- [ ] Verify deployment successful
- [ ] Check for build errors

### 3. Environment Variables
Add these in hosting platform:
```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

---

## Domain & DNS Setup

### 1. Domain Configuration
- [ ] Point domain to hosting provider
- [ ] Add A records
- [ ] Add CNAME records
- [ ] Wait for DNS propagation (24-48 hours)
- [ ] Verify domain resolves correctly

### 2. SSL Certificate
- [ ] Verify SSL certificate issued automatically
- [ ] Test HTTPS works
- [ ] Force HTTPS redirect
- [ ] Update Supabase redirect URLs

### 3. Email Domain
- [ ] Add domain to Resend
- [ ] Add SPF record to DNS
- [ ] Add DKIM record to DNS
- [ ] Add DMARC record to DNS
- [ ] Verify domain in Resend
- [ ] Test email sending

---

## Payment Gateway Configuration

### 1. Paystack Setup
- [ ] Create production Paystack account
- [ ] Verify business information
- [ ] Get live API keys
- [ ] Configure webhook URL: `https://yourdomain.com/functions/v1/paystack-webhook`
- [ ] Test live payment
- [ ] Verify webhook receives events

### 2. Remita Setup
- [ ] Create production Remita account
- [ ] Verify business information
- [ ] Get live credentials
- [ ] Configure callback URL
- [ ] Test live payment
- [ ] Verify payment confirmation works

### 3. Update Admin Settings
- [ ] Log in to admin panel
- [ ] Go to Payment Settings
- [ ] Enable Paystack
- [ ] Enter Paystack live keys
- [ ] Enable Remita
- [ ] Enter Remita live credentials
- [ ] Test both payment methods

---

## Email Configuration

### 1. Resend Setup
- [ ] Create Resend account
- [ ] Verify email address
- [ ] Add custom domain
- [ ] Add DNS records (SPF, DKIM, DMARC)
- [ ] Verify domain (wait 24-48hrs)
- [ ] Generate API key
- [ ] Test email sending

### 2. Configure in Admin Panel
- [ ] Log in to admin panel
- [ ] Go to Site Settings
- [ ] Add email configuration:
  - [ ] From Name: "YourSiteName"
  - [ ] From Email: "noreply@yourdomain.com"
  - [ ] Resend API Key: Your live key
- [ ] Save settings
- [ ] Send test email
- [ ] Verify email received

---

## Cron Jobs Setup

Your platform uses automatic draws that run hourly. Verify these are working:

### 1. Auto-Draw Cron
- [ ] Verify `process-auto-draw` edge function deployed
- [ ] Check Supabase cron jobs (Database → Cron Jobs)
- [ ] Create cron job if not exists:
  ```sql
  SELECT cron.schedule(
    'process-auto-draw',
    '0 * * * *', -- Every hour
    $$
    SELECT net.http_post(
      url := 'https://yourproject.supabase.co/functions/v1/process-auto-draw',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    );
    $$
  );
  ```
- [ ] Test cron job manually
- [ ] Verify draws process correctly

### 2. Auto-Create Jackpots (if enabled)
- [ ] Verify `auto-create-jackpots` function deployed
- [ ] Check if automatic jackpot creation is needed
- [ ] Create cron job if needed
- [ ] Test jackpot auto-creation

---

## Testing Phase

### 1. Functional Tests
- [ ] Register new user account
- [ ] Verify email received (if verification enabled)
- [ ] Log in successfully
- [ ] Update profile
- [ ] Upload avatar
- [ ] Make small deposit (₦100)
- [ ] Verify deposit approved
- [ ] Buy lottery ticket
- [ ] Check ticket in dashboard
- [ ] Request withdrawal (small amount)
- [ ] Verify withdrawal processed
- [ ] Check transaction history
- [ ] Test referral code
- [ ] Test achievement unlocking

### 2. Admin Tests
- [ ] Log in to admin panel
- [ ] Create new jackpot
- [ ] Edit existing jackpot
- [ ] Process manual draw
- [ ] Approve deposits
- [ ] Approve withdrawals
- [ ] View user list
- [ ] View transactions
- [ ] Update site settings
- [ ] Update payment settings
- [ ] Test bonus settings

### 3. Payment Tests
Test with real small amounts:
- [ ] Paystack deposit (₦100)
- [ ] Verify payment completed
- [ ] Verify balance updated
- [ ] Remita deposit (₦100)
- [ ] Verify payment completed
- [ ] Verify balance updated
- [ ] Test withdrawal to bank account
- [ ] Verify funds received (wait 1-3 days)

### 4. Email Tests
- [ ] Registration email
- [ ] Password reset email
- [ ] Deposit approved email
- [ ] Withdrawal processed email
- [ ] Jackpot win email
- [ ] Verify all emails received
- [ ] Verify correct sender address

### 5. Performance Tests
- [ ] Page load time < 3 seconds
- [ ] Mobile responsive
- [ ] Images load properly
- [ ] Forms submit correctly
- [ ] No console errors
- [ ] No 404 errors

### 6. Security Tests
- [ ] HTTPS active
- [ ] Mixed content warnings resolved
- [ ] Protected routes require login
- [ ] Admin routes require admin role
- [ ] RLS policies enforced
- [ ] Secrets not exposed
- [ ] CORS configured correctly

---

## Post-Migration

### 1. Monitoring Setup
- [ ] Set up error tracking (Sentry)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Set up performance monitoring
- [ ] Configure alerts for downtime
- [ ] Monitor edge function logs
- [ ] Monitor database performance

### 2. Backup Strategy
- [ ] Enable daily Supabase backups
- [ ] Set up database export schedule
- [ ] Document backup restoration process
- [ ] Test backup restoration

### 3. Documentation
- [ ] Document all custom configurations
- [ ] Save all credentials securely
- [ ] Create admin user guide
- [ ] Create support documentation
- [ ] Document troubleshooting steps

### 4. Communication
- [ ] Notify users of new domain (if changed)
- [ ] Update social media links
- [ ] Update email signatures
- [ ] Update marketing materials
- [ ] Update app store links (if applicable)

### 5. Cleanup
- [ ] Delete old development project (after 30 days)
- [ ] Remove test data
- [ ] Archive old backups
- [ ] Revoke old API keys
- [ ] Remove old DNS records

---

## Rollback Plan

If something goes wrong, be prepared to rollback:

### Emergency Rollback Steps
1. [ ] Keep old environment running for 7 days
2. [ ] Document rollback procedure
3. [ ] Update DNS to point back to old server
4. [ ] Restore database from backup
5. [ ] Redeploy previous version
6. [ ] Notify users of temporary issue

### Common Issues & Solutions

**Issue: Users can't log in**
```
Solution:
1. Check auth configuration
2. Verify site URL in Supabase
3. Check redirect URLs
4. Clear browser cache
```

**Issue: Payments failing**
```
Solution:
1. Verify using live keys
2. Check webhook URLs
3. Verify payment settings in admin
4. Check edge function logs
```

**Issue: Emails not sending**
```
Solution:
1. Verify domain in Resend
2. Check DNS records (wait 24-48hrs)
3. Verify API key
4. Check edge function logs
```

**Issue: Draws not running**
```
Solution:
1. Check cron job configuration
2. Verify edge function deployed
3. Check edge function logs
4. Manually trigger draw to test
```

---

## Timeline Estimate

**Small Project (< 100 users):** 1-2 days
- Day 1: Database + backend migration
- Day 2: Frontend deployment + testing

**Medium Project (100-1000 users):** 3-5 days
- Day 1: Planning + backups
- Day 2-3: Database + backend migration
- Day 4: Frontend deployment
- Day 5: Testing + monitoring setup

**Large Project (1000+ users):** 1-2 weeks
- Week 1: Careful planning, staged migration
- Week 2: Testing, monitoring, optimization

---

## Success Criteria

Migration is successful when:
- ✅ All users can log in
- ✅ All payments processing
- ✅ All emails sending
- ✅ Automatic draws running
- ✅ No critical errors in logs
- ✅ Performance acceptable
- ✅ Security verified
- ✅ Monitoring active

---

## Support

If you encounter issues:
1. Check edge function logs in Supabase
2. Check frontend console errors
3. Check payment gateway dashboards
4. Review this checklist
5. Contact support if needed

🎉 **Migration Complete!** Your platform is now running in production.
