import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  type: 'deposit_approved' | 'withdrawal_processed' | 'jackpot_win';
  amount: number;
  jackpotName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, type, amount, jackpotName }: NotificationRequest = await req.json();

    console.log('Sending notification:', { userId, type, amount });

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Fetch email settings from site_settings
    const { data: siteSettings } = await supabase
      .from('site_settings')
      .select('email_from_name, email_from_address, resend_api_key, site_name')
      .limit(1)
      .maybeSingle();

    // Determine which API key and from address to use
    const resendApiKey = siteSettings?.resend_api_key || Deno.env.get('RESEND_API_KEY');
    const fromName = siteSettings?.email_from_name || siteSettings?.site_name || 'JackpotWin';
    const fromAddress = siteSettings?.email_from_address || 'onboarding@resend.dev';
    const fromEmail = `${fromName} <${fromAddress}>`;

    if (!resendApiKey) {
      console.log('No Resend API key configured, skipping email notification');
      return new Response(
        JSON.stringify({ success: true, message: 'Email not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const resend = new Resend(resendApiKey);

    let subject = '';
    let html = '';

    switch (type) {
      case 'deposit_approved':
        subject = `Deposit Approved - ${fromName}`;
        html = `
          <h1>Deposit Approved!</h1>
          <p>Hi ${profile.full_name || 'there'},</p>
          <p>Your deposit of <strong>₦${amount.toFixed(2)}</strong> has been approved and added to your wallet.</p>
          <p>You can now use your balance to purchase lottery tickets and win big!</p>
          <p>Good luck!</p>
          <p>Best regards,<br>The ${fromName} Team</p>
        `;
        break;

      case 'withdrawal_processed':
        subject = `Withdrawal Processed - ${fromName}`;
        html = `
          <h1>Withdrawal Processed!</h1>
          <p>Hi ${profile.full_name || 'there'},</p>
          <p>Your withdrawal request of <strong>₦${amount.toFixed(2)}</strong> has been processed.</p>
          <p>The funds should arrive in your account within 1-3 business days.</p>
          <p>Thank you for using ${fromName}!</p>
          <p>Best regards,<br>The ${fromName} Team</p>
        `;
        break;

      case 'jackpot_win':
        subject = `🎉 Congratulations! You Won! - ${fromName}`;
        html = `
          <h1 style="color: #e3a008;">🎉 CONGRATULATIONS! 🎉</h1>
          <p>Hi ${profile.full_name || 'there'},</p>
          <h2>You just won the ${jackpotName || 'jackpot'}!</h2>
          <p style="font-size: 24px; color: #e3a008; font-weight: bold;">Prize: ₦${amount.toFixed(2)}</p>
          <p>Your prize has been automatically credited to your wallet.</p>
          <p>You can now use it to buy more tickets or withdraw it to your bank account.</p>
          <p>Keep playing and good luck!</p>
          <p>Best regards,<br>The ${fromName} Team</p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [profile.email],
      subject: subject,
      html: html,
    });

    console.log('Email sent successfully:', emailResponse);

    // Create in-app notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: type,
      title: subject,
      message: html.replace(/<[^>]*>/g, '').substring(0, 200), // Strip HTML tags
      read: false,
    });

    // Try to send push notification if user has subscriptions
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: userId,
          title: subject,
          body: `₦${amount.toFixed(2)} - ${type.replace('_', ' ')}`,
          data: { type, amount },
          url: '/dashboard',
        }
      });
    } catch (pushError) {
      console.log('Failed to send push notification, continuing...', pushError);
    }

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
