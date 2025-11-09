import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

export default function AdminPayments({ paymentSettings, onUpdate }: AdminPaymentsProps) {
  const handleToggle = async (id: string, currentState: boolean) => {
    await onUpdate(id, { is_enabled: !currentState });
  };

  const handleSave = async (setting: PaymentSetting, formData: FormData) => {
    const updates: any = {};
    
    formData.forEach((value, key) => {
      if (value) updates[key] = value;
    });

    if (Object.keys(updates).length === 0) {
      toast.error("Please fill in at least one field");
      return;
    }

    await onUpdate(setting.id, updates);
  };

  return (
    <div className="space-y-6">
      {paymentSettings.map((setting) => (
        <Card key={setting.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="capitalize">{setting.provider} Payment Gateway</CardTitle>
                <CardDescription>
                  Configure {setting.provider} payment integration
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`${setting.provider}-enabled`}>
                  {setting.is_enabled ? "Enabled" : "Disabled"}
                </Label>
                <Switch
                  id={`${setting.provider}-enabled`}
                  checked={setting.is_enabled}
                  onCheckedChange={() => handleToggle(setting.id, setting.is_enabled)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSave(setting, formData);
              }}
              className="space-y-4"
            >
              {setting.provider === "paystack" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`${setting.provider}-public-key`}>Public Key</Label>
                    <Input
                      id={`${setting.provider}-public-key`}
                      name="public_key"
                      type="text"
                      placeholder="pk_test_xxxxxxxxxxxxx"
                      defaultValue={setting.public_key || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${setting.provider}-secret-key`}>Secret Key</Label>
                    <Input
                      id={`${setting.provider}-secret-key`}
                      name="secret_key"
                      type="password"
                      placeholder="sk_test_xxxxxxxxxxxxx"
                      defaultValue={setting.secret_key || ""}
                    />
                  </div>
                </>
              )}

              {setting.provider === "remita" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`${setting.provider}-merchant-id`}>Merchant ID</Label>
                    <Input
                      id={`${setting.provider}-merchant-id`}
                      name="merchant_id"
                      type="text"
                      placeholder="Enter merchant ID"
                      defaultValue={setting.merchant_id || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${setting.provider}-api-key`}>API Key</Label>
                    <Input
                      id={`${setting.provider}-api-key`}
                      name="api_key"
                      type="password"
                      placeholder="Enter API key"
                      defaultValue={setting.api_key || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${setting.provider}-public-key`}>Public Key</Label>
                    <Input
                      id={`${setting.provider}-public-key`}
                      name="public_key"
                      type="text"
                      placeholder="Enter public key"
                      defaultValue={setting.public_key || ""}
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full">
                Save {setting.provider.charAt(0).toUpperCase() + setting.provider.slice(1)} Settings
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}