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

    const { email, amount, reference, transaction_type } = await req.json();

    console.log(`Sending payment receipt to: ${email}`);

    // Fetch site settings
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

    const transactionTitle = transaction_type === 'deposit' ? 'Deposit Confirmed' : 'Withdrawal Processed';
    const transactionIcon = transaction_type === 'deposit' ? '💰' : '✅';

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
        subject: `${transactionIcon} ${transactionTitle} - ${siteName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">${transactionIcon} ${transactionTitle}</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
                
                <p style="font-size: 16px; margin-bottom: 25px;">
                  Your ${transaction_type} has been successfully processed!
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #059669; margin-top: 0;">Transaction Details</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 10px 0; font-weight: bold;">Amount:</td>
                      <td style="padding: 10px 0; text-align: right;">₦${Number(amount).toLocaleString()}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 10px 0; font-weight: bold;">Reference:</td>
                      <td style="padding: 10px 0; text-align: right; font-family: monospace;">${reference}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; font-weight: bold;">Type:</td>
                      <td style="padding: 10px 0; text-align: right; text-transform: capitalize;">${transaction_type}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://luckywin.name.ng/dashboard" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            font-weight: bold; 
                            display: inline-block;
                            font-size: 16px;">
                    View Dashboard
                  </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="font-size: 14px; color: #666;">
                    If you have any questions about this transaction, please contact our support team.
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
    console.error('Error in send-payment-receipt:', error);
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
