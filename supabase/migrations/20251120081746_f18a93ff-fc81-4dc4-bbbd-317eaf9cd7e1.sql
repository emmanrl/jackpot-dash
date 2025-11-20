-- Add processing_stage column to transactions table
ALTER TABLE transactions 
ADD COLUMN processing_stage TEXT DEFAULT 'initiated' CHECK (processing_stage IN ('initiated', 'verifying', 'transferring', 'completed', 'failed'));

-- Add error_message column to store failure reasons
ALTER TABLE transactions 
ADD COLUMN error_message TEXT;

-- Enable realtime for transactions table
ALTER TABLE transactions REPLICA IDENTITY FULL;