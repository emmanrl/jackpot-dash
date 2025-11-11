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

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { transaction_id, action, admin_note } = await req.json();

    if (!transaction_id || !action || !['approve', 'reject'].includes(action)) {
      throw new Error('Invalid request parameters');
    }

    console.log(`Processing ${action} for transaction ${transaction_id} by admin ${user.id}`);

    // Get the transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();

    if (txError || !transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'pending') {
      throw new Error('Transaction is not pending');
    }

    // Update transaction status
    const newStatus = action === 'approve' ? 'completed' : 'cancelled';
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: newStatus,
        processed_by: user.id,
        processed_at: new Date().toISOString(),
        admin_note: admin_note || null
      })
      .eq('id', transaction_id);

    if (updateError) {
      throw new Error(`Failed to update transaction: ${updateError.message}`);
    }

    // If approved, update wallet balance
    if (action === 'approve') {
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', transaction.user_id)
        .single();

      if (walletError || !wallet) {
        throw new Error('Wallet not found');
      }

      const currentBalance = parseFloat(wallet.balance);
      const amount = parseFloat(transaction.amount);
      const newBalance = transaction.type === 'deposit' 
        ? currentBalance + amount 
        : currentBalance - amount;

      if (newBalance < 0) {
        throw new Error('Insufficient balance for withdrawal');
      }

      const { error: balanceError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', transaction.user_id);

      if (balanceError) {
        throw new Error(`Failed to update wallet balance: ${balanceError.message}`);
      }

      console.log(`Updated wallet balance for user ${transaction.user_id}: ${newBalance}`);
      
      // Create notification
      const notificationType = transaction.type === 'deposit' ? 'deposit_approved' : 'withdrawal_approved';
      const notificationTitle = transaction.type === 'deposit' 
        ? '💰 Deposit Approved' 
        : '✅ Withdrawal Approved';
      const notificationMessage = transaction.type === 'deposit'
        ? `Your deposit of ₦${amount.toFixed(2)} has been approved and added to your wallet.`
        : `Your withdrawal of ₦${amount.toFixed(2)} has been approved and processed.`;
      
      await supabase.from('notifications').insert({
        user_id: transaction.user_id,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        is_read: false
      });
    } else if (action === 'reject') {
      // Create rejection notification
      const notificationTitle = transaction.type === 'deposit' 
        ? '❌ Deposit Rejected' 
        : '❌ Withdrawal Rejected';
      const notificationMessage = `Your ${transaction.type} request of ₦${parseFloat(transaction.amount).toFixed(2)} has been rejected.${admin_note ? ` Reason: ${admin_note}` : ''}`;
      
      await supabase.from('notifications').insert({
        user_id: transaction.user_id,
        type: `${transaction.type}_rejected`,
        title: notificationTitle,
        message: notificationMessage,
        is_read: false
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Transaction ${action}d successfully` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in approve-transaction:', error);
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
