import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PaymentSetting {
  id: string;
  provider: string;
  is_enabled: boolean;
  public_key: string | null;
  secret_key: string | null;
  merchant_id: string | null;
  api_key: string | null;
}

interface AdminPaymentsProps {
  paymentSettings: PaymentSetting[];
  onUpdate: (id: string, updates: any) => Promise<void>;
}

const paystackSchema = z.object({
  public_key: z.string()
    .min(1, "Public key is required")
    .regex(/^pk_(test|live)_[a-zA-Z0-9]+$/, "Invalid Paystack public key format. Must be pk_test_* or pk_live_*"),
  secret_key: z.string()
    .min(1, "Secret key is required")
    .regex(/^sk_(test|live)_[a-zA-Z0-9]+$/, "Invalid Paystack secret key format. Must be sk_test_* or sk_live_*"),
});

type PaystackFormData = z.infer<typeof paystackSchema>;

function PaystackSettingCard({ setting, onUpdate, onToggle }: { 
  setting: PaymentSetting; 
  onUpdate: (id: string, updates: any) => Promise<void>;
  onToggle: (id: string, currentState: boolean) => Promise<void>;
}) {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaystackFormData>({
    resolver: zodResolver(paystackSchema),
    defaultValues: {
      public_key: setting.public_key || "",
      secret_key: setting.secret_key || "",
    },
  });

  const onSubmit = async (data: PaystackFormData) => {
    setIsSubmitting(true);
    try {
      // Trim whitespace from keys before saving
      const normalized = {
        public_key: data.public_key.trim(),
        secret_key: data.secret_key.trim(),
      };
      await onUpdate(setting.id, normalized);
      toast.success(`${setting.provider} settings updated successfully`);
    } catch (error) {
      toast.error(`Failed to update ${setting.provider} settings`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVisibility = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="capitalize">Paystack Payment Gateway</CardTitle>
            <CardDescription>
              Configure Paystack payment integration for deposits and withdrawals
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="paystack-enabled" className="text-sm">
              {setting.is_enabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id="paystack-enabled"
              checked={setting.is_enabled}
              onCheckedChange={() => onToggle(setting.id, setting.is_enabled)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="public_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public Key</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="pk_test_xxxxxxxxxxxxx" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secret_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret Key</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        type={showSecrets.secret_key ? "text" : "password"}
                        placeholder="sk_test_xxxxxxxxxxxxx" 
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility("secret_key")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSecrets.secret_key ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Paystack Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


export default function AdminPayments({ paymentSettings, onUpdate }: AdminPaymentsProps) {
  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      await onUpdate(id, { is_enabled: !currentState });
      toast.success("Payment gateway status updated");
    } catch (error) {
      toast.error("Failed to update payment gateway status");
    }
  };

  const paystackSetting = paymentSettings.find(s => s.provider === "paystack");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Payment Gateway Configuration</h2>
        <p className="text-muted-foreground">
          Configure Paystack for processing deposits and withdrawals
        </p>
      </div>
      {paystackSetting && (
        <PaystackSettingCard
          setting={paystackSetting}
          onUpdate={onUpdate}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}
