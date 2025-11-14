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
      
      // Fetch from withdrawal_accounts table
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

    // Get Paystack settings
    const { data: settings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('provider', 'paystack')
      .eq('is_enabled', true)
      .single();

    if (settingsError || !settings || !settings.secret_key) {
      throw new Error('Paystack is not configured or enabled');
    }

    // Get bank code from bank name (you may want to maintain a mapping)
    const bankCode = await getBankCode(bankDetails.bank_name, settings.secret_key);

    // Step 1: Create Transfer Recipient
    console.log('Creating transfer recipient...');
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
    console.log('Recipient response:', recipientData);

    if (!recipientData.status) {
      throw new Error(recipientData.message || 'Failed to create transfer recipient');
    }

    const recipientCode = recipientData.data.recipient_code;

    // Step 2: Calculate withdrawal fee (1%)
    const withdrawalFee = parseFloat(transaction.amount) * 0.01;
    const netAmount = parseFloat(transaction.amount) - withdrawalFee;
    
    console.log('Withdrawal fee calculated:', { 
      originalAmount: transaction.amount, 
      fee: withdrawalFee, 
      netAmount 
    });

    // Step 3: Initiate Transfer
    console.log('Initiating transfer...');
    const transferReference = `WTH-${Date.now()}-${transactionId.substring(0, 8)}`;
    
    // Convert net amount to kobo (smallest currency unit)
    const amountInKobo = Math.round(netAmount * 100);

    const transferResponse = await fetch('https://api.paystack.co/transfer', {
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
        reference: transferReference,
      }),
    });

    const transferData = await transferResponse.json();
    console.log('Transfer response:', transferData);

    if (!transferData.status) {
      throw new Error(transferData.message || 'Failed to initiate transfer');
    }

    // Update transaction with transfer details
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'approved',
        reference: transferReference,
        processed_at: new Date().toISOString(),
        admin_note: JSON.stringify({
          ...bankDetails,
          transfer_code: transferData.data.transfer_code,
          recipient_code: recipientCode,
          withdrawal_fee: withdrawalFee,
        }),
      })
      .eq('id', transactionId);

    if (updateError) throw updateError;

    // Deduct from user wallet
    const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
      p_user_id: transaction.user_id,
      p_amount: -parseFloat(transaction.amount),
    });

    if (walletError) {
      console.error('Failed to update wallet:', walletError);
      throw new Error('Failed to update wallet balance');
    }

    // Add withdrawal fee to admin wallet
    const { error: adminWalletError } = await supabase.rpc('increment_admin_wallet', {
      p_amount: withdrawalFee,
    });

    if (adminWalletError) {
      console.error('Failed to update admin wallet:', adminWalletError);
      // Don't fail the withdrawal if admin wallet update fails
    }

    // Send notification
    await supabase.functions.invoke('send-notification', {
      body: {
        userId: transaction.user_id,
        type: 'withdrawal_processed',
        amount: parseFloat(transaction.amount),
      }
    });

    console.log('Withdrawal processed successfully:', { transferReference });

    return new Response(
      JSON.stringify({ 
        success: true, 
        transferCode: transferData.data.transfer_code,
        reference: transferReference 
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

// Helper function to get bank code
async function getBankCode(bankName: string, secretKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.paystack.co/bank', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    const data = await response.json();
    
    if (!data.status || !data.data) {
      throw new Error('Failed to fetch banks');
    }

    // Try to match bank name
    const bank = data.data.find((b: any) => 
      b.name.toLowerCase().includes(bankName.toLowerCase()) ||
      bankName.toLowerCase().includes(b.name.toLowerCase())
    );

    if (!bank) {
      throw new Error(`Bank not found: ${bankName}`);
    }

    return bank.code;
  } catch (error) {
    console.error('Error fetching bank code:', error);
    throw new Error(`Failed to resolve bank code for ${bankName}`);
  }
}
