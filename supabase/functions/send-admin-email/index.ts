import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  recipients: string[];
  subject: string;
  message: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get site settings for email configuration
    const { data: settings } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .single();

    const resendApiKey = settings?.resend_api_key || "re_Nn1uZHqv_Kj1rs5YAXoyTDLjUygxABEQ6";
    const fromEmail = settings?.email_from_address || "noreply@luckywin.name.ng";
    const fromName = settings?.email_from_name || "LuckyWin";

    const resend = new Resend(resendApiKey);

    const { recipients, subject, message }: EmailRequest = await req.json();

    console.log("Sending admin email to:", recipients.length, "recipients");

    // Send email to all recipients
    const emailPromises = recipients.map((email) =>
      resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [email],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">LuckyWin</h1>
            </div>
            <div style="padding: 30px; background-color: #f9fafb;">
              <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="white-space: pre-wrap; line-height: 1.6; color: #374151;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
              <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
                © ${new Date().getFullYear()} LuckyWin. All rights reserved.
              </p>
            </div>
          </div>
        `,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount = results.filter((r) => r.status === "rejected").length;

    console.log(`Emails sent: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending admin email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
