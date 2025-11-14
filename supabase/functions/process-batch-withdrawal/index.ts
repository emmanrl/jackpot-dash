import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchWithdrawalRequest {
  transactionIds: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { transactionIds } = await req.json() as BatchWithdrawalRequest;

    console.log('Processing batch withdrawal:', { transactionIds });

    if (!transactionIds || transactionIds.length === 0) {
      throw new Error('No transactions provided');
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

    // Fetch all transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .in('id', transactionIds)
      .eq('type', 'withdrawal')
      .eq('status', 'pending');

    if (txError || !transactions || transactions.length === 0) {
      throw new Error('No valid pending transactions found');
    }

    console.log(`Processing ${transactions.length} withdrawals`);

    // Prepare bulk transfer data
    const transfers = [];
    const bankCodeCache = new Map<string, string>();

    for (const transaction of transactions) {
      const bankDetails = JSON.parse(transaction.admin_note || '{}');
      
      if (!bankDetails.account_number || !bankDetails.bank_name || !bankDetails.account_name) {
        console.error(`Invalid bank details for transaction ${transaction.id}`);
        continue;
      }

      // Get or fetch bank code
      let bankCode = bankCodeCache.get(bankDetails.bank_name);
      if (!bankCode) {
        bankCode = await getBankCode(bankDetails.bank_name, settings.secret_key);
        bankCodeCache.set(bankDetails.bank_name, bankCode);
      }

      // Create recipient
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
      
      if (!recipientData.status) {
        console.error(`Failed to create recipient for ${transaction.id}:`, recipientData.message);
        continue;
      }

      // Calculate withdrawal fee (1%)
      const withdrawalFee = parseFloat(transaction.amount) * 0.01;
      const netAmount = parseFloat(transaction.amount) - withdrawalFee;
      const amountInKobo = Math.round(netAmount * 100);

      transfers.push({
        amount: amountInKobo,
        recipient: recipientData.data.recipient_code,
        reason: `Withdrawal - ${transaction.reference}`,
        reference: `WTH-${Date.now()}-${transaction.id.substring(0, 8)}`,
        transactionId: transaction.id,
        userId: transaction.user_id,
        fee: withdrawalFee,
        recipientCode: recipientData.data.recipient_code,
      });
    }

    if (transfers.length === 0) {
      throw new Error('No valid transfers to process');
    }

    console.log(`Initiating ${transfers.length} bulk transfers`);

    // Process transfers using Paystack Bulk Transfer API
    const bulkResponse = await fetch('https://api.paystack.co/transfer/bulk', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.secret_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        transfers: transfers.map(t => ({
          amount: t.amount,
          recipient: t.recipient,
          reason: t.reason,
          reference: t.reference,
        })),
      }),
    });

    const bulkData = await bulkResponse.json();
    
    if (!bulkData.status) {
      throw new Error(bulkData.message || 'Bulk transfer failed');
    }

    console.log('Bulk transfer initiated:', bulkData);

    // Update transactions and wallets
    const results = [];
    for (const transfer of transfers) {
      try {
        // Update transaction
        await supabase
          .from('transactions')
          .update({
            status: 'approved',
            reference: transfer.reference,
            processed_at: new Date().toISOString(),
            admin_note: JSON.stringify({
              ...JSON.parse(transactions.find(t => t.id === transfer.transactionId)?.admin_note || '{}'),
              recipient_code: transfer.recipientCode,
              withdrawal_fee: transfer.fee,
            }),
          })
          .eq('id', transfer.transactionId);

        // Deduct from user wallet
        await supabase.rpc('increment_wallet_balance', {
          p_user_id: transfer.userId,
          p_amount: -(parseFloat(transactions.find(t => t.id === transfer.transactionId)?.amount || '0')),
        });

        // Add fee to admin wallet
        await supabase.rpc('increment_admin_wallet', {
          p_amount: transfer.fee,
        });

        // Send notification
        await supabase.functions.invoke('send-notification', {
          body: {
            userId: transfer.userId,
            type: 'withdrawal_processed',
            amount: parseFloat(transactions.find(t => t.id === transfer.transactionId)?.amount || '0'),
          }
        });

        results.push({ transactionId: transfer.transactionId, success: true });
      } catch (error: any) {
        console.error(`Failed to update transaction ${transfer.transactionId}:`, error);
        results.push({ transactionId: transfer.transactionId, success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Batch withdrawal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

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
