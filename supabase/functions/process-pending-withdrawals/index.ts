import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting automatic withdrawal processing...');

    // Fetch all pending withdrawals
    const { data: pendingWithdrawals, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'withdrawal')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingWithdrawals || pendingWithdrawals.length === 0) {
      console.log('No pending withdrawals to process');
      return new Response(
        JSON.stringify({ message: 'No pending withdrawals', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingWithdrawals.length} pending withdrawals`);

    let processed = 0;
    let failed = 0;

    // Process each withdrawal
    for (const withdrawal of pendingWithdrawals) {
      try {
        console.log(`Processing withdrawal ${withdrawal.id}...`);
        
        // Update status to processing
        await supabase
          .from('transactions')
          .update({ 
            status: 'approved',
            processing_stage: 'verifying',
            processed_at: new Date().toISOString()
          })
          .eq('id', withdrawal.id);

        // Call process-withdrawal function
        const { error: processError } = await supabase.functions.invoke('process-withdrawal', {
          body: { transactionId: withdrawal.id }
        });

        if (processError) {
          console.error(`Failed to process withdrawal ${withdrawal.id}:`, processError);
          
          // Mark as failed and refund
          await supabase
            .from('transactions')
            .update({ 
              status: 'rejected',
              processing_stage: 'failed',
              error_message: processError.message
            })
            .eq('id', withdrawal.id);

          // Refund the balance
          await supabase.rpc('increment_wallet_balance', {
            p_user_id: withdrawal.user_id,
            p_amount: withdrawal.amount
          });

          // Notify user of failure
          await supabase.from('notifications').insert({
            user_id: withdrawal.user_id,
            type: 'withdrawal_failed',
            title: 'Withdrawal Failed',
            message: `Your withdrawal of ₦${withdrawal.amount} failed. Funds have been refunded to your wallet.`,
            data: { transactionId: withdrawal.id, error: processError.message }
          });

          failed++;
        } else {
          processed++;
          console.log(`Successfully processed withdrawal ${withdrawal.id}`);
        }
      } catch (error) {
        console.error(`Error processing withdrawal ${withdrawal.id}:`, error);
        failed++;
      }
    }

    console.log(`Processed ${processed} withdrawals, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: 'Processing complete',
        total: pendingWithdrawals.length,
        processed,
        failed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-pending-withdrawals:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
