import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WithdrawalRequest {
  transactionId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { transactionId } = await req.json() as WithdrawalRequest;

    console.log('Processing withdrawal:', { transactionId });

    // Get transaction details
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('type', 'withdrawal')
      .single();

    if (txError || !transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'pending') {
      throw new Error('Transaction is not pending');
    }

    // Parse bank details from admin_note, or fetch from withdrawal_accounts
    let bankDetails = transaction.admin_note ? JSON.parse(transaction.admin_note) : null;
    
    if (!bankDetails?.account_number || !bankDetails?.bank_name || !bankDetails?.account_name) {
      console.log('Bank details not in admin_note, fetching from withdrawal_accounts...');
      
      const { data: account, error: accountError } = await supabase
        .from('withdrawal_accounts')
        .select('*')
        .eq('user_id', transaction.user_id)
        .eq('is_default', true)
        .single();

      if (accountError || !account) {
        throw new Error('No withdrawal account found for this user');
      }

      bankDetails = {
        account_number: account.account_number,
        bank_name: account.bank_name,
        account_name: account.account_name,
      };
      
      console.log('Retrieved bank details from withdrawal_accounts:', bankDetails);
    }

    // Get enabled withdrawal provider (Paystack or Flutterwave)
    const { data: settings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('is_withdrawal_enabled', true)
      .in('provider', ['paystack', 'flutterwave'])
      .single();

    if (settingsError || !settings || !settings.secret_key) {
      throw new Error('No withdrawal provider is configured or enabled. Please configure payment settings in admin panel.');
    }

    console.log('Using withdrawal provider:', settings.provider);

    let transferResponse;
    const withdrawalFee = parseFloat(transaction.amount) * (settings.withdrawal_fee_percentage || 0.01);
    const netAmount = parseFloat(transaction.amount) - withdrawalFee;

    if (settings.provider === 'paystack') {
      // Paystack withdrawal
      const bankCode = await getPaystackBankCode(bankDetails.bank_name, settings.secret_key);

      // Create Transfer Recipient
      console.log('Creating Paystack transfer recipient...');
      const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.secret_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nuban',
          name: bankDetails.account_name,
          account_number: bankDetails.account_number,
          bank_code: bankCode,
          currency: 'NGN',
        }),
      });

      const recipientData = await recipientResponse.json();
      console.log('Paystack recipient response:', recipientData);

      if (!recipientData.status) {
        throw new Error(recipientData.message || 'Failed to create transfer recipient');
      }

      const recipientCode = recipientData.data.recipient_code;
      const amountInKobo = Math.round(netAmount * 100);

      // Initiate Transfer
      console.log('Initiating Paystack transfer...');
      const transferResp = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.secret_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'balance',
          amount: amountInKobo,
          recipient: recipientCode,
          reason: `Withdrawal - ${transaction.reference}`,
          reference: `WTH-${Date.now()}-${transaction.id.substring(0, 8)}`,
        }),
      });

      transferResponse = await transferResp.json();
      console.log('Paystack transfer response:', transferResponse);

      if (!transferResponse.status) {
        let errorMessage = transferResponse.message || 'Failed to initiate transfer';
        
        // Update transaction with error details
        await supabase
          .from('transactions')
          .update({ 
            status: 'rejected',
            admin_note: JSON.stringify({ error: errorMessage, provider: 'paystack' })
          })
          .eq('id', transaction.id);
        
        throw new Error(errorMessage);
      }

    } else if (settings.provider === 'flutterwave') {
      // Flutterwave withdrawal
      const bankCode = await getFlutterwaveBankCode(bankDetails.bank_name, settings.secret_key);

      console.log('Initiating Flutterwave transfer...');
      const transferResp = await fetch('https://api.flutterwave.com/v3/transfers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.secret_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_bank: bankCode,
          account_number: bankDetails.account_number,
          amount: netAmount,
          narration: `Withdrawal - ${transaction.reference}`,
          currency: 'NGN',
          reference: `WTH-${Date.now()}-${transaction.id.substring(0, 8)}`,
          callback_url: `https://luckywin.name.ng/api/flutterwave-transfer-webhook`,
          debit_currency: 'NGN',
        }),
      });

      transferResponse = await transferResp.json();
      console.log('Flutterwave transfer response:', transferResponse);

      if (transferResponse.status !== 'success') {
        let errorMessage = transferResponse.message || 'Failed to initiate transfer';
        
        // Handle IP whitelisting error specifically
        if (errorMessage.includes('IP Whitelisting')) {
          errorMessage = 'Flutterwave requires IP whitelisting. Please go to your Flutterwave dashboard → Settings → API → Enable IP Whitelisting and add these IPs: 0.0.0.0/0 (for all IPs) or contact Flutterwave support for Supabase edge function IPs.';
        }
        
        // Update transaction with error details
        await supabase
          .from('transactions')
          .update({ 
            status: 'rejected',
            admin_note: JSON.stringify({ error: errorMessage, provider: 'flutterwave' })
          })
          .eq('id', transaction.id);
        
        throw new Error(errorMessage);
      }
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ 
        status: 'approved', 
        processed_at: new Date().toISOString(),
        reference: transferResponse.data?.reference || transaction.reference
      })
      .eq('id', transaction.id);

    // Deduct from user wallet and add fee to admin wallet
    await supabase.rpc('increment_wallet_balance', {
      p_user_id: transaction.user_id,
      p_amount: -parseFloat(transaction.amount)
    });

    await supabase.rpc('increment_admin_wallet', {
      p_amount: withdrawalFee
    });

    // Send notification
    await supabase.functions.invoke('send-notification', {
      body: {
        userId: transaction.user_id,
        type: 'withdrawal_approved',
        amount: netAmount
      }
    });

    console.log('Withdrawal processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Withdrawal processed successfully',
        provider: settings.provider,
        transfer: transferResponse.data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Withdrawal processing error:', error);
    
    // Send email notification to admins about the failure
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get all admin emails
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (adminRoles && adminRoles.length > 0) {
        const { data: adminProfiles } = await supabase
          .from('profiles')
          .select('email')
          .in('id', adminRoles.map(r => r.user_id));
        
        if (adminProfiles && adminProfiles.length > 0) {
          const adminEmails = adminProfiles.map(p => p.email);
          
          // Get transaction details for the email
          const { data: transaction } = await supabase
            .from('transactions')
            .select('*, profiles!inner(email, full_name)')
            .eq('id', error.transactionId || 'unknown')
            .single();
          
          const { data: settings } = await supabase
            .from('payment_settings')
            .select('provider')
            .eq('is_withdrawal_enabled', true)
            .in('provider', ['paystack', 'flutterwave'])
            .single();
          
          // Send email to admins using Resend
          const { data: siteSettings } = await supabase
            .from('site_settings')
            .select('resend_api_key')
            .limit(1)
            .single();
          
          const resendApiKey = siteSettings?.resend_api_key;
          if (resendApiKey) {
            const Resend = (await import('https://esm.sh/resend@2.0.0')).Resend;
            const resend = new Resend(resendApiKey);
            
            const emailSubject = `🚨 Automatic Withdrawal Failed - Action Required`;
            const emailMessage = `
<strong>Automatic Withdrawal Processing Failed</strong>

A withdrawal attempt has failed and requires your attention.

<strong>Error Details:</strong>
${error.message}

<strong>Transaction Information:</strong>
- Transaction ID: ${error.transactionId || 'Unknown'}
- User: ${transaction?.profiles?.full_name || 'Unknown'} (${transaction?.profiles?.email || 'Unknown'})
- Amount: ₦${transaction?.amount || 'Unknown'}
- Provider: ${settings?.provider || 'Unknown'}
- Time: ${new Date().toLocaleString()}

<strong>Recommended Actions:</strong>
1. Check the payment provider dashboard (${settings?.provider || 'Unknown'})
2. Verify IP whitelisting is enabled (for Flutterwave)
3. Confirm API keys are correct
4. Check provider balance sufficiency
5. Review the transaction in the admin panel

Please resolve this issue as soon as possible to ensure smooth operations.
            `;
            
            await resend.emails.send({
              from: 'LuckyWin Payments <payment@luckywin.name.ng>',
              to: adminEmails,
              subject: emailSubject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Withdrawal Failed</h1>
                  </div>
                  <div style="padding: 30px; background-color: #f9fafb;">
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <div style="white-space: pre-wrap; line-height: 1.6; color: #374151;">
                        ${emailMessage.replace(/\n/g, '<br>')}
                      </div>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
                      © ${new Date().getFullYear()} LuckyWin. All rights reserved.
                    </p>
                  </div>
                </div>
              `,
            });
            
            console.log('Failure notification sent to admins:', adminEmails);
          }
        }
      }
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

async function getPaystackBankCode(bankName: string, secretKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.paystack.co/bank', {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    const data = await response.json();
    
    if (!data.status) {
      throw new Error('Failed to fetch Paystack banks');
    }

    const bank = data.data.find((b: any) => 
      b.name.toLowerCase().includes(bankName.toLowerCase()) ||
      bankName.toLowerCase().includes(b.name.toLowerCase())
    );

    if (!bank) {
      throw new Error(`Bank not found: ${bankName}`);
    }

    return bank.code;
  } catch (error) {
    console.error('Error fetching Paystack bank code:', error);
    throw error;
  }
}

async function getFlutterwaveBankCode(bankName: string, secretKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.flutterwave.com/v3/banks/NG', {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error('Failed to fetch Flutterwave banks');
    }

    const bank = data.data.find((b: any) => 
      b.name.toLowerCase().includes(bankName.toLowerCase()) ||
      bankName.toLowerCase().includes(b.name.toLowerCase())
    );

    if (!bank) {
      throw new Error(`Bank not found: ${bankName}`);
    }

    return bank.code;
  } catch (error) {
    console.error('Error fetching Flutterwave bank code:', error);
    throw error;
  }
}