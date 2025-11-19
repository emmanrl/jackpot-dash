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
        throw new Error(transferResponse.message || 'Failed to initiate transfer');
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
        throw new Error(transferResponse.message || 'Failed to initiate transfer');
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