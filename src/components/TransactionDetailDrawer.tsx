import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

interface TransactionDetailDrawerProps {
  transaction: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (transactionId: string, action: 'approve' | 'reject', adminNote?: string) => Promise<void>;
  userEmail?: string;
  processing: boolean;
}

export default function TransactionDetailDrawer({
  transaction,
  open,
  onOpenChange,
  onApprove,
  userEmail,
  processing
}: TransactionDetailDrawerProps) {
  const [adminNote, setAdminNote] = useState("");

  const handleAction = async (action: 'approve' | 'reject') => {
    await onApprove(transaction.id, action, adminNote);
    setAdminNote("");
  };

  if (!transaction) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Transaction Details</SheetTitle>
          <SheetDescription>
            Review transaction information and take action
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={
                  transaction.status === 'approved' ? 'default' :
                  transaction.status === 'rejected' ? 'destructive' : 
                  'secondary'
                }>
                  {transaction.status}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-muted-foreground">User Email</Label>
              <p className="mt-1 font-medium">{userEmail || '—'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="mt-1 font-medium capitalize">{transaction.type}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Amount</Label>
                <p className="mt-1 font-medium">₦{Number(transaction.amount).toLocaleString()}</p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-muted-foreground">Reference</Label>
              <p className="mt-1 font-mono text-sm break-all">{transaction.reference || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p className="mt-1 text-sm">{new Date(transaction.created_at).toLocaleString()}</p>
              </div>
              {transaction.processed_at && (
                <div>
                  <Label className="text-muted-foreground">Processed At</Label>
                  <p className="mt-1 text-sm">{new Date(transaction.processed_at).toLocaleString()}</p>
                </div>
              )}
            </div>

            {transaction.admin_note && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Previous Admin Note</Label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-md">{transaction.admin_note}</p>
                </div>
              </>
            )}

            {transaction.status === 'pending' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="admin-note">Admin Note (Optional)</Label>
                  <Textarea
                    id="admin-note"
                    placeholder="Add a note about this transaction..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleAction('approve')}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                  </Button>
                  <Button
                    onClick={() => handleAction('reject')}
                    disabled={processing}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
