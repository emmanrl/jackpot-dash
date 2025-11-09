# JackpotWin Setup Instructions

## Payment Gateway Configuration

### 1. Configure Payment Providers (Paystack or Remita)

1. Navigate to the Admin Panel (`/admin`)
2. Go to the "Payment Settings" tab
3. For each payment provider you want to enable:

#### Paystack Setup:
- **Public Key**: Get from [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developers) (starts with `pk_`)
- **Secret Key**: Get from [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developers) (starts with `sk_`)
- Enable the toggle to activate Paystack payments

#### Remita Setup:
- **Merchant ID**: Provided by Remita
- **API Key**: Get from Remita integration settings
- **Public Key**: Get from Remita integration settings
- Enable the toggle to activate Remita payments

### 2. Email Notifications (Optional but Recommended)

To enable email notifications for deposits, withdrawals, and wins:

1. Sign up for [Resend](https://resend.com)
2. Verify your domain at [Resend Domains](https://resend.com/domains)
3. Create an API key at [Resend API Keys](https://resend.com/api-keys)
4. Add the secret using the secrets management feature:
   - Secret Name: `RESEND_API_KEY`
   - Secret Value: Your Resend API key

## Features Overview

### For Users:

1. **Instant Deposits**
   - Click "Deposit Funds" on the dashboard
   - Select your preferred payment method (Paystack or Remita)
   - Enter amount and proceed to payment gateway
   - Funds are added instantly after successful payment

2. **Buy Tickets**
   - Active jackpots are shown on the dashboard
   - Click "Buy Tickets" on any active jackpot
   - Select quantity (1-100 tickets)
   - Tickets are purchased using wallet balance
   - Each ticket gives you a chance to win

3. **View Statistics**
   - Click "Statistics" button on dashboard
   - View real-time jackpot participation
   - See total prize pools and winning trends
   - Interactive charts for better insights

4. **Win Notifications**
   - Winners are automatically selected during draws
   - Prize money is instantly added to wallet
   - Email notification sent (if configured)

### For Admins:

1. **Manage Jackpots**
   - Create new jackpots with custom frequencies
   - Set ticket prices and initial prize pools
   - Monitor ticket sales in real-time

2. **Auto-Draw System**
   - Draws are processed automatically every hour
   - Random winner selection from all ticket holders
   - Prize distribution is instant
   - Next draw time is calculated automatically

3. **Payment Gateway Management**
   - Enable/disable payment providers
   - Update API credentials anytime
   - Monitor transaction status

4. **User Management**
   - View all users and their balances
   - Monitor transactions
   - Approve manual withdrawal requests

## Automatic Draw Processing

The system includes an automatic draw processor that runs every hour via a cron job. It:

1. Checks for jackpots due for a draw
2. Selects a random winner from all tickets
3. Credits the prize to the winner's wallet
4. Sends email notification to the winner
5. Resets the jackpot for the next draw

## Security Features

- Row Level Security (RLS) enabled on all tables
- Secure payment gateway integration
- Encrypted API keys in edge functions
- Email verification for authentication
- Admin role-based access control

## Testing

### Test Payment Flow:
1. Create a test account
2. Use Paystack/Remita test credentials
3. Make a test deposit
4. Purchase tickets
5. Check wallet balance and tickets

### Test Auto-Draw (Manual Trigger):
1. Go to the Lovable Cloud backend
2. Navigate to Edge Functions
3. Find `process-auto-draw` function
4. Click "Invoke" to manually trigger a draw

## Support

For issues or questions:
- Check the console logs in browser dev tools
- Review edge function logs in Lovable Cloud backend
- Ensure all payment API credentials are correct
- Verify email settings if notifications aren't working

## Production Checklist

Before going live:

- [ ] Set up production payment gateway credentials
- [ ] Configure custom email domain in Resend
- [ ] Test deposit and withdrawal flows
- [ ] Test ticket purchasing
- [ ] Verify auto-draw is running (check cron job logs)
- [ ] Test email notifications
- [ ] Set up proper SSL/TLS for your domain
- [ ] Review all RLS policies for security
- [ ] Set appropriate rate limits
- [ ] Monitor error logs regularly
