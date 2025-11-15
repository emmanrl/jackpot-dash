import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState<string>("Verifying your payment...");

  useEffect(() => {
    const verify = async () => {
      const reference = searchParams.get("reference") || searchParams.get("trxref");
      const provider = "paystack"; // Currently only Paystack uses callback
      const urlStatus = (searchParams.get("status") || "").toLowerCase();

      if (!reference) {
        setStatus("error");
        setMessage("Missing payment reference.");
        toast.error("Missing payment reference.");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { reference, provider },
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        });

        if (error) throw error;

        setStatus("success");
        setMessage("Payment verified successfully. Funds added to your wallet.");
        toast.success("Deposit successful! Your wallet has been updated.");
        
        // Redirect to homepage with receipt modal
        setTimeout(() => {
          navigate(`/?receipt=true&reference=${reference}&amount=${data.amount || 0}`);
        }, 1500);
      } catch (err: any) {
        console.error("Verification error:", err);
        const msg = err?.message || "Payment verification failed.";
        setStatus("error");
        setMessage(msg);
        toast.error(msg);
        setTimeout(() => navigate("/"), 2000);
      }
    };

    verify();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === "verifying" && <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />}
        {status === "success" && <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />}
        {status === "error" && <XCircle className="w-10 h-10 text-destructive mx-auto" />}
        <p className="text-lg">{message}</p>
        <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
