import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PaymentProvider {
  id: string;
  provider: string;
  is_enabled: boolean;
}

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export default function DepositDialog({ open, onOpenChange, userEmail }: DepositDialogProps) {
  const [amount, setAmount] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);

  useEffect(() => {
    if (open) {
      fetchProviders();
    }
  }, [open]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('id, provider, is_enabled')
        .eq('is_enabled', true);

      if (error) throw error;

      setProviders(data || []);
      if (data && data.length > 0) {
        setSelectedProvider(data[0].provider);
      }
    } catch (error: any) {
      toast.error("Failed to load payment providers");
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleDeposit = async () => {
    try {
      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      if (!selectedProvider) {
        toast.error("Please select a payment provider");
        return;
      }

      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to continue");
        return;
      }

      // Call edge function to initiate payment
      const { data, error } = await supabase.functions.invoke('initiate-payment', {
        body: {
          amount: depositAmount,
          email: userEmail,
          provider: selectedProvider
        }
      });

      if (error) throw error;

      if (data.paymentUrl) {
        // Redirect to payment gateway
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("Failed to get payment URL");
      }

    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>
            Add money to your wallet instantly via payment gateway
          </DialogDescription>
        </DialogHeader>

        {loadingProviders ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : providers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No payment providers are currently available.</p>
            <p className="text-sm mt-2">Please contact support.</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <Label>Payment Provider</Label>
              <RadioGroup 
                value={selectedProvider} 
                onValueChange={setSelectedProvider}
                disabled={loading}
              >
                {providers.map((provider) => (
                  <div key={provider.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={provider.provider} id={provider.provider} />
                    <Label 
                      htmlFor={provider.provider} 
                      className="capitalize cursor-pointer"
                    >
                      {provider.provider}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p>• You will be redirected to the payment gateway</p>
              <p>• Funds will be added to your wallet instantly after payment</p>
              <p>• Minimum deposit: ₦100</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button 
            onClick={handleDeposit} 
            disabled={loading || loadingProviders || providers.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Proceed to Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
