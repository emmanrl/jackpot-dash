import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, token, token_hash, email_action_type } = await req.json();

    console.log('Sending signup verification email to:', email);

    // Fetch site settings for email configuration
    const { data: settings } = await supabase
      .from('site_settings')
      .select('resend_api_key, email_from_name, email_from_address, site_name')
      .single();

    if (!settings || !settings.resend_api_key) {
      throw new Error('Email settings not configured');
    }

    const resendApiKey = settings.resend_api_key;
    const fromName = settings.email_from_name || 'LuckyWin';
    const fromEmail = settings.email_from_address || 'noreply@luckywin.name.ng';
    const siteName = settings.site_name || 'LuckyWin';

    // Construct verification URL
    const verificationUrl = `https://luckywin.name.ng/auth?token_hash=${token_hash}&type=${email_action_type}`;

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [email],
        subject: `Welcome to ${siteName} - Verify Your Email`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${siteName}! 🎉</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Thank you for signing up with ${siteName}! We're excited to have you join our community of winners.
                </p>
                
                <p style="font-size: 16px; margin-bottom: 25px;">
                  To get started, please verify your email address by clicking the button below:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            font-weight: bold; 
                            display: inline-block;
                            font-size: 16px;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="font-size: 12px; color: #667eea; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
                  ${verificationUrl}
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="font-size: 14px; color: #666;">
                    If you didn't create an account with ${siteName}, you can safely ignore this email.
                  </p>
                </div>
                
                <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                  <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const emailData = await emailResponse.json();
    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-signup-verification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
