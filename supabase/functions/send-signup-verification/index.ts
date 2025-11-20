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

    // Construct verification URL - redirects to tutorial page
    const verificationUrl = `https://luckywin.name.ng/tutorial?token_hash=${token_hash}&type=${email_action_type}`;

    // Send email using Resend with fun comic-style design
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [email],
        subject: `🎰 BOOM! Welcome to ${siteName} - Let's Get You Started! 💥`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff9e6;">
              <!-- Header with comic explosion effect -->
              <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 40px 30px; text-align: center; border-radius: 20px 20px 0 0; border: 4px solid #000; position: relative; box-shadow: 8px 8px 0 #000;">
                <div style="font-size: 60px; margin-bottom: 10px;">💰🎉🎊</div>
                <h1 style="color: #000; margin: 0; font-size: 32px; text-shadow: 3px 3px 0 #FFD700, 6px 6px 0 rgba(0,0,0,0.2); font-weight: bold; letter-spacing: 2px;">WELCOME ABOARD!</h1>
                <div style="background: #FF6B6B; color: white; display: inline-block; padding: 8px 20px; border-radius: 20px; margin-top: 15px; border: 3px solid #000; font-size: 14px; font-weight: bold; transform: rotate(-2deg); box-shadow: 3px 3px 0 #000;">NEW WINNER INCOMING! 🚀</div>
              </div>
              
              <!-- Main content with comic speech bubbles -->
              <div style="background: white; padding: 40px 30px; border-radius: 0 0 20px 20px; border: 4px solid #000; border-top: none; box-shadow: 8px 8px 0 #000;">
                <!-- Greeting bubble -->
                <div style="background: #FFE66D; padding: 20px; border-radius: 15px; border: 3px solid #000; position: relative; margin-bottom: 25px; box-shadow: 4px 4px 0 #000;">
                  <div style="position: absolute; top: -10px; left: 30px; width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 15px solid #000;"></div>
                  <div style="position: absolute; top: -6px; left: 32px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 12px solid #FFE66D;"></div>
                  <p style="font-size: 18px; margin: 0; font-weight: bold; color: #000;">Hey Champion! 👋</p>
                </div>
                
                <p style="font-size: 17px; margin-bottom: 20px; color: #000;">
                  🎯 You just took the FIRST STEP to becoming our next BIG WINNER! 
                </p>
                
                <p style="font-size: 17px; margin-bottom: 20px; color: #000;">
                  But wait... <span style="background: #FF6B6B; color: white; padding: 2px 8px; border-radius: 5px; border: 2px solid #000;">⚡ ACTION REQUIRED!</span>
                </p>
                
                <!-- Excitement box -->
                <div style="background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%); padding: 20px; border-radius: 15px; border: 3px solid #000; margin: 25px 0; box-shadow: 4px 4px 0 #000;">
                  <p style="font-size: 16px; margin: 0 0 10px 0; color: white; font-weight: bold;">
                    🎁 What's waiting for you after verification:
                  </p>
                  <ul style="color: white; font-size: 15px; margin: 0; padding-left: 20px;">
                    <li>🎰 Access to LIVE jackpots</li>
                    <li>💎 Exclusive welcome bonuses</li>
                    <li>🏆 Join 1000+ happy winners</li>
                    <li>⚡ Lightning-fast withdrawals</li>
                  </ul>
                </div>
                
                <p style="font-size: 17px; margin-bottom: 25px; color: #000; font-weight: bold;">
                  👉 Click the BIG button below to verify and START WINNING! 👇
                </p>
                
                <!-- Big CTA Button -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${verificationUrl}" 
                     style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); 
                            color: white; 
                            padding: 20px 50px; 
                            text-decoration: none; 
                            border-radius: 50px; 
                            font-weight: bold; 
                            display: inline-block;
                            font-size: 20px;
                            border: 4px solid #000;
                            box-shadow: 6px 6px 0 #000;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            transform: rotate(-1deg);">
                    🚀 VERIFY & WIN NOW! 💰
                  </a>
                </div>
                
                <!-- Alternate link -->
                <div style="background: #F7F7F7; padding: 15px; border-radius: 10px; border: 2px dashed #000; margin-top: 30px;">
                  <p style="font-size: 13px; color: #666; margin: 0 0 10px 0; font-weight: bold;">
                    🔗 Button not working? Copy this magic link:
                  </p>
                  <p style="font-size: 11px; color: #4ECDC4; word-break: break-all; background: white; padding: 10px; border-radius: 5px; border: 2px solid #000; margin: 0;">
                    ${verificationUrl}
                  </p>
                </div>
                
                <!-- Fun footer -->
                <div style="margin-top: 35px; padding-top: 25px; border-top: 3px dashed #000;">
                  <div style="text-align: center; margin-bottom: 15px;">
                    <span style="font-size: 30px;">🎲</span>
                    <span style="font-size: 30px;">🎰</span>
                    <span style="font-size: 30px;">💰</span>
                  </div>
                  <p style="font-size: 13px; color: #666; text-align: center; margin: 0;">
                    <strong>P.S.</strong> Didn't sign up? No worries! Just ignore this email and we'll pretend this never happened! 😉
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px; padding: 20px; background: #F7F7F7; border-radius: 10px; border: 2px solid #E0E0E0;">
                  <p style="margin: 5px 0; font-weight: bold; color: #000;">© ${new Date().getFullYear()} ${siteName}</p>
                  <p style="margin: 5px 0;">Making winners every day! 🎉</p>
                  <p style="margin: 5px 0; font-size: 10px;">This is your lucky email - don't delete it! 🍀</p>
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
