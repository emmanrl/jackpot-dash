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

    const { email } = await req.json();

    console.log('Sending email verification to:', email);

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

    // Use Supabase's built-in email verification resend
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (resendError) throw resendError;

    const verificationUrl = `https://luckywin.name.ng/settings`;

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
        subject: `Verify Your Email - ${siteName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">✉️ Verify Your Email</h1>
              </div>
              
              <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  To complete your account setup and enable withdrawals on ${siteName}, please verify your email address.
                </p>
                
                <p style="font-size: 16px; margin-bottom: 25px; font-weight: bold; color: #667eea;">
                  Email verification is required before you can withdraw your winnings.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            font-weight: bold; 
                            display: inline-block;
                            font-size: 16px;
                            box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="font-size: 12px; color: #667eea; word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 5px; border: 1px solid #e0e0e0;">
                  ${verificationUrl}
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
                  <p style="font-size: 14px; color: #999;">
                    If you didn't request this verification, you can safely ignore this email.
                  </p>
                </div>
                
                <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                  <p style="margin: 5px 0;">© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
                  <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
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
    console.error('Error in send-email-verification:', error);
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
