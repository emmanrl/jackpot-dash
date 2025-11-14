# JackpotWin - Complete Project Structure Guide

## 📁 Project Overview

This is a comprehensive jackpot lottery platform built with React, TypeScript, Vite, and Supabase. The platform allows users to purchase tickets, participate in draws, win prizes, and manage their accounts.

---

## 🗂️ Root Directory Files

### Configuration Files

- **`package.json`** - Project dependencies and npm scripts
- **`tsconfig.json`** - TypeScript compiler configuration
- **`tsconfig.app.json`** - TypeScript config for app source code
- **`tsconfig.node.json`** - TypeScript config for Node.js environment
- **`vite.config.ts`** - Vite bundler configuration
- **`tailwind.config.ts`** - Tailwind CSS styling configuration
- **`postcss.config.js`** - PostCSS configuration
- **`components.json`** - shadcn/ui components configuration
- **`eslint.config.js`** - ESLint linting rules
- **`.gitignore`** - Git ignore patterns
- **`.env`** - Environment variables (auto-generated)

### Documentation

- **`README.md`** - Basic project information and setup
- **`PROJECT_STRUCTURE.md`** - This file - comprehensive project structure guide
- **`SETUP_INSTRUCTIONS.md`** - Detailed setup and deployment instructions

---

## 📂 Folder Structure

```
jackpot-platform/
├── public/              # Static assets
├── src/                 # Application source code
├── supabase/           # Backend configuration
└── node_modules/       # Dependencies (auto-generated)
```

---

## 🌐 `/public` - Static Assets

Public files served directly by the web server.

### Files:
- **`robots.txt`** - SEO crawler instructions
- **`sitemap.xml`** - SEO sitemap for search engines
- **`sw.js`** - Service worker for PWA and push notifications
- **`favicon.ico`** - Website favicon
- **`placeholder.svg`** - Default placeholder image

---

## 💻 `/src` - Application Source Code

### Main Entry Points

- **`main.tsx`** - Application entry point, renders React app
- **`App.tsx`** - Root component with routing configuration
- **`App.css`** - Global application styles
- **`index.css`** - Global CSS with design system tokens and Tailwind directives
- **`vite-env.d.ts`** - Vite environment type definitions

---

## 📄 `/src/pages` - Page Components

Each page represents a distinct route in the application.

### Public Pages
- **`Index.tsx`** - Homepage with hero section and active jackpots
- **`Auth.tsx`** - User authentication (login/signup)
- **`AboutUs.tsx`** - Company information and mission
- **`FAQ.tsx`** - Frequently asked questions
- **`HowItWorksPage.tsx`** - Detailed platform explanation
- **`TermsOfService.tsx`** - Legal terms and conditions
- **`PrivacyPolicy.tsx`** - Privacy policy and data handling
- **`FairPlayPolicy.tsx`** - Fair play rules and transparency
- **`ContactSupport.tsx`** - Support contact form
- **`WinnersGallery.tsx`** - Public winners showcase
- **`NotFound.tsx`** - 404 error page

### User Dashboard Pages
- **`Dashboard.tsx`** - User dashboard with tickets, wallet, and stats
- **`Profile.tsx`** - User profile view
- **`EditProfile.tsx`** - Profile editing interface
- **`Settings.tsx`** - User settings (theme, notifications, password)
- **`ChangePassword.tsx`** - Password change form
- **`TransactionHistory.tsx`** - Transaction history with filters
- **`Withdrawal.tsx`** - Withdrawal request page
- **`UserProfile.tsx`** - Public user profile view
- **`PaymentCallback.tsx`** - Payment provider callback handler
- **`LeaderboardPage.tsx`** - Global leaderboard rankings
- **`Statistics.tsx`** - Platform statistics and analytics

### Admin Pages
- **`Admin.tsx`** - Main admin dashboard
- **`AdminPayments.tsx`** - Payment settings management
- **`AdminWithdrawals.tsx`** - Withdrawal approvals
- **`UserManagement.tsx`** - User administration
- **`SiteSettings.tsx`** - Site-wide settings configuration

---

## 🧩 `/src/components` - Reusable Components

### Layout Components
- **`TopNav.tsx`** - Top navigation bar with user menu
- **`Footer.tsx`** - Site footer with links
- **`Hero.tsx`** - Homepage hero section
- **`NavLink.tsx`** - Navigation link component

### Jackpot Components
- **`JackpotCard.tsx`** - Individual jackpot display card
- **`ActiveJackpots.tsx`** - List of active jackpots
- **`TicketCard.tsx`** - User ticket display
- **`TicketPurchaseDialog.tsx`** - Ticket purchase modal
- **`JackpotAutomationDialog.tsx`** - Automated jackpot creation
- **`CountdownTimer.tsx`** - Draw countdown timer

### Winner Components
- **`RecentWinners.tsx`** - Recent winners list
- **`WinCelebrationModal.tsx`** - Winner celebration animation
- **`WinShareCard.tsx`** - Social sharing card for wins
- **`WinnersPodium.tsx`** - Top 3 winners podium display
- **`DrawDetailsModal.tsx`** - Detailed draw results modal
- **`Leaderboard.tsx`** - Leaderboard component

### User Components
- **`UserActivityFeed.tsx`** - User activity timeline
- **`UserFollowButton.tsx`** - Follow/unfollow button
- **`UserFollowStats.tsx`** - Follower statistics
- **`PublicProfileCard.tsx`** - Public profile card
- **`AchievementBadge.tsx`** - Achievement display

### Transaction Components
- **`DepositDialog.tsx`** - Deposit funds modal
- **`TransactionDetailDrawer.tsx`** - Transaction details drawer
- **`ReceiptModal.tsx`** - Transaction receipt display

### Settings Components
- **`NotificationSettings.tsx`** - Notification preferences
- **`ThemeSelector.tsx`** - Theme selection component
- **`BonusSettingsPanel.tsx`** - Admin bonus configuration

### Utility Components
- **`NotificationBell.tsx`** - Notification bell icon with badge
- **`PushNotificationPrompt.tsx`** - Push notification permission prompt
- **`ReferralCard.tsx`** - Referral program card
- **`ReferralSignupField.tsx`** - Referral code input
- **`HowItWorks.tsx`** - How it works section

---

## 🎨 `/src/components/ui` - UI Component Library

Reusable UI components based on shadcn/ui and Radix UI.

### Components:
- **`button.tsx`** - Button variants
- **`card.tsx`** - Card container
- **`dialog.tsx`** - Modal dialogs
- **`input.tsx`** - Text inputs
- **`select.tsx`** - Dropdown selects
- **`table.tsx`** - Data tables
- **`tabs.tsx`** - Tab navigation
- **`badge.tsx`** - Status badges
- **`avatar.tsx`** - User avatars
- **`toast.tsx` / `toaster.tsx`** - Toast notifications
- **`alert.tsx` / `alert-dialog.tsx`** - Alert messages
- **`dropdown-menu.tsx`** - Dropdown menus
- **`form.tsx`** - Form components
- **`label.tsx`** - Form labels
- **`checkbox.tsx`** - Checkboxes
- **`switch.tsx`** - Toggle switches
- **`slider.tsx`** - Range sliders
- **`progress.tsx`** - Progress bars
- **`calendar.tsx`** - Date picker
- **`popover.tsx`** - Popovers
- **`tooltip.tsx`** - Tooltips
- **`sheet.tsx`** - Side sheets
- **`drawer.tsx`** - Bottom drawers
- **`accordion.tsx`** - Accordions
- **`carousel.tsx`** - Image carousels
- **`chart.tsx`** - Chart components
- **`scroll-area.tsx`** - Scrollable areas
- **`separator.tsx`** - Dividers
- **`skeleton.tsx`** - Loading skeletons
- **`sonner.tsx`** - Sonner toast integration
- **Additional components** - See folder for complete list

---

## 🪝 `/src/hooks` - Custom React Hooks

Reusable logic hooks for various features.

### Hooks:
- **`use-toast.ts`** - Toast notification hook
- **`use-mobile.tsx`** - Mobile detection hook
- **`useTheme.ts`** - Theme management
- **`useDarkMode.ts`** - Dark mode toggle
- **`useSiteSettings.ts`** - Site settings fetcher
- **`useDailyLogin.ts`** - Daily login rewards
- **`useAchievementNotifications.ts`** - Achievement notifications
- **`useDrawNotifications.ts`** - Draw notifications
- **`useWinNotification.ts`** - Win notifications
- **`usePushNotifications.ts`** - Push notification setup
- **`useRealtimeAvatar.ts`** - Real-time avatar updates

---

## 🛠️ `/src/lib` - Utility Libraries

### Files:
- **`utils.ts`** - General utility functions (className merging, etc.)

---

## 🗄️ `/src/integrations/supabase` - Supabase Integration

Auto-generated Supabase client and types.

### Files:
- **`client.ts`** - Supabase client instance (DO NOT EDIT)
- **`types.ts`** - Database type definitions (DO NOT EDIT)

**Note:** These files are auto-generated by Supabase. Do not modify manually.

---

## ⚡ `/supabase` - Backend Configuration

Backend database, functions, and configuration.

### Folders:

#### `/supabase/functions` - Edge Functions

Serverless backend functions for business logic.

**Functions:**
- **`approve-transaction/`** - Approve user transactions
- **`auto-create-jackpots/`** - Automated jackpot creation
- **`delete-jackpot/`** - Delete jackpots
- **`get-banks/`** - Fetch bank list
- **`get-payment-providers/`** - Fetch enabled payment providers
- **`initiate-payment/`** - Initialize payment transactions
- **`paystack-webhook/`** - Paystack payment webhook
- **`process-auto-draw/`** - Process automated draws
- **`process-batch-withdrawal/`** - Batch withdrawal processing
- **`process-draw/`** - Process jackpot draws
- **`process-withdrawal/`** - Process single withdrawal
- **`purchase-ticket/`** - Purchase jackpot tickets
- **`send-notification/`** - Send in-app notifications
- **`send-push-notification/`** - Send push notifications
- **`verify-bank-account/`** - Bank account verification
- **`verify-payment/`** - Payment verification

Each function folder contains:
- **`index.ts`** - Function entry point

#### `/supabase/migrations` - Database Migrations

SQL migration files for database schema changes (auto-managed).

### Files:
- **`config.toml`** - Supabase project configuration (DO NOT EDIT MANUALLY)

---

## 🎨 Design System

### Theme Tokens (defined in `index.css`)

**Color Variables:**
- `--background` - Page background
- `--foreground` - Text on background
- `--card` - Card backgrounds
- `--primary` - Primary brand color
- `--secondary` - Secondary UI color
- `--muted` - Muted backgrounds
- `--accent` - Accent highlights
- `--destructive` - Error/delete actions
- `--border` - Border colors
- `--input` - Input backgrounds
- `--ring` - Focus ring colors

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`
- Dark mode support

---

## 🗃️ Database Schema

### Main Tables

**`profiles`** - User profiles
- `id`, `email`, `full_name`, `avatar_url`, `experience_points`, `referral_code`, `theme`, `dark_mode`

**`jackpots`** - Jackpot configurations
- `id`, `name`, `description`, `ticket_price`, `prize_pool`, `frequency`, `next_draw`, `winners_count`, `status`, `category`

**`tickets`** - User tickets
- `id`, `user_id`, `jackpot_id`, `ticket_number`, `ticket_sequence`, `purchase_price`, `purchased_at`

**`winners`** - Draw winners
- `id`, `user_id`, `jackpot_id`, `draw_id`, `ticket_id`, `prize_amount`, `winner_rank`, `claimed_at`, `total_pool_amount`, `total_participants`

**`wallets`** - User wallets
- `id`, `user_id`, `balance`, `created_at`, `updated_at`

**`transactions`** - Financial transactions
- `id`, `user_id`, `type`, `amount`, `status`, `reference`, `processed_by`, `created_at`

**`admin_wallet`** - Platform earnings
- `id`, `balance`, `created_at`, `updated_at`

**`notifications`** - User notifications
- `id`, `user_id`, `type`, `title`, `message`, `data`, `is_read`, `created_at`

**`achievements`** - User achievements
- `id`, `user_id`, `achievement_type`, `metadata`, `achieved_at`

**`referrals`** - Referral tracking
- `id`, `referrer_id`, `referred_id`, `total_commission`, `created_at`

**`site_settings`** - Site configuration
- `id`, `site_name`, `site_logo_url`, `contact_email`, `support_email`, `contact_phone`, `terms_of_service`, `privacy_policy`, `faq`

**Other Tables:**
- `user_roles` - User role assignments
- `bonus_settings` - Bonus configurations
- `payment_settings` - Payment provider settings
- `withdrawal_accounts` - User bank accounts
- `daily_login_rewards` - Daily login tracking
- `user_follows` - User following system
- `push_subscriptions` - Push notification subscriptions
- `draws` - Draw history

---

## 🔐 Security

### Row Level Security (RLS)
All tables have RLS policies enforcing data access control.

### Authentication
- Email/password authentication
- Google OAuth (configurable)
- Auto-confirm email signups

### Admin Access
- Admin role stored in `user_roles` table
- Admin checks on sensitive operations
- Separate admin routes and components

---

## 📦 Key Dependencies

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Radix UI** - Accessible primitives
- **Recharts** - Data visualization
- **Sonner** - Toast notifications
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Lucide React** - Icons
- **date-fns** - Date utilities
- **html2canvas** - Screenshot generation
- **react-confetti** - Celebration animations

### Backend
- **Supabase** - Backend as a service
- **@supabase/supabase-js** - Supabase client

---

## 🚀 Deployment

### Frontend Deployment
1. Click "Publish" button in Lovable
2. Frontend changes require clicking "Update" to deploy
3. Custom domain can be connected in settings

### Backend Deployment
- Edge functions deploy automatically
- Database migrations require approval
- Secrets managed in Lovable Cloud

---

## 🔄 Development Workflow

### Making Changes
1. Use Lovable AI for code generation
2. Preview changes in real-time
3. Test functionality
4. Deploy to production

### Adding Features
1. Identify required components/pages
2. Create database tables if needed (via migrations)
3. Build UI components
4. Add edge functions for backend logic
5. Test and deploy

### Best Practices
- Use semantic design tokens (no hardcoded colors)
- Follow existing component patterns
- Keep components small and focused
- Use TypeScript for type safety
- Write clear, descriptive variable names
- Add comments for complex logic

---

## 📞 Support

For questions or issues:
- Check `/src/pages/FAQ.tsx` for common questions
- Contact support via `/src/pages/ContactSupport.tsx`
- Review documentation at `https://docs.lovable.dev`

---

## 🎯 Feature Roadmap

Current platform features:
✅ User authentication and profiles
✅ Jackpot creation and management
✅ Ticket purchasing
✅ Automated draws with multiple winners
✅ Wallet system
✅ Deposit and withdrawal
✅ Referral system
✅ Achievements and gamification
✅ Push notifications
✅ Dark mode
✅ Admin dashboard
✅ Real-time updates
✅ Payment integration (Paystack, Flutterwave, Remita)
✅ Social features (follow, leaderboard)
✅ Statistics and analytics

---

This documentation is maintained alongside the codebase. For the most up-to-date information, always refer to the actual code files.
