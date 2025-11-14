import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WithdrawalTransaction {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  reference: string | null;
  created_at: string;
  processed_at: string | null;
  admin_note: string | null;
  profiles: {
    email: string;
    full_name: string;
  } | null;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalTransaction | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *
        `)
        .eq("type", "withdrawal")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = Array.from(new Set((data || []).map(t => t.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      // Map profiles to transactions
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const enrichedData = (data || []).map(tx => ({
        ...tx,
        profiles: profileMap.get(tx.user_id) || null
      }));

      setWithdrawals(enrichedData);
    } catch (error: any) {
      console.error("Failed to fetch withdrawals:", error);
      toast.error("Failed to load withdrawal requests");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (withdrawal: WithdrawalTransaction) => {
    setSelectedWithdrawal(withdrawal);
    setShowConfirmDialog(true);
  };

  const confirmProcessWithdrawal = async () => {
    if (!selectedWithdrawal) return;

    setProcessing(selectedWithdrawal.id);
    setShowConfirmDialog(false);

    try {
      const { data, error } = await supabase.functions.invoke('process-withdrawal', {
        body: {
          transactionId: selectedWithdrawal.id,
        }
      });

      if (error) throw error;

      toast.success("Withdrawal processed successfully via Paystack!");
      await fetchWithdrawals();
    } catch (error: any) {
      console.error("Failed to process withdrawal:", error);
      toast.error(`Failed to process withdrawal: ${error.message}`);
    } finally {
      setProcessing(null);
      setSelectedWithdrawal(null);
    }
  };

  const handleBatchProcess = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select withdrawals to process");
      return;
    }

    if (!confirm(`Process ${selectedIds.length} withdrawal(s) via Paystack bulk transfer?`)) return;

    setBatchProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-batch-withdrawal', {
        body: {
          transactionIds: selectedIds,
        }
      });

      if (error) throw error;

      toast.success(`Successfully processed ${data.processed} withdrawal(s)`);
      if (data.failed > 0) {
        toast.warning(`Failed to process ${data.failed} withdrawal(s)`);
      }
      
      setSelectedIds([]);
      await fetchWithdrawals();
    } catch (error: any) {
      console.error("Batch processing failed:", error);
      toast.error(`Failed to process withdrawals: ${error.message}`);
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    if (!confirm("Are you sure you want to reject this withdrawal request?")) return;

    setProcessing(id);
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ 
          status: "rejected",
          processed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Withdrawal request rejected");
      await fetchWithdrawals();
    } catch (error: any) {
      console.error("Failed to reject withdrawal:", error);
      toast.error("Failed to reject withdrawal request");
    } finally {
      setProcessing(null);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pendingIds = withdrawals.filter(w => w.status === "pending").map(w => w.id);
    setSelectedIds(prev => 
      prev.length === pendingIds.length ? [] : pendingIds
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-500", label: "Pending" },
      approved: { color: "bg-green-500", label: "Approved" },
      rejected: { color: "bg-red-500", label: "Rejected" },
    };

    const variant = variants[status] || { color: "bg-gray-500", label: status };
    
    return (
      <Badge className={`${variant.color} text-white`}>
        {variant.label}
      </Badge>
    );
  };

  const parseBankDetails = (adminNote: string | null) => {
    try {
      return JSON.parse(adminNote || '{}');
    } catch {
      return {};
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Withdrawal Requests</span>
            {selectedIds.length > 0 && (
              <Button 
                onClick={handleBatchProcess}
                disabled={batchProcessing}
                className="ml-auto"
              >
                {batchProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing {selectedIds.length} withdrawal(s)...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Process {selectedIds.length} Selected
                  </>
                )}
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Process user withdrawal requests via Paystack Transfer API (1% fee applied)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === withdrawals.filter(w => w.status === "pending").length && withdrawals.filter(w => w.status === "pending").length > 0}
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No withdrawal requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  withdrawals.map((withdrawal) => {
                    const bankDetails = parseBankDetails(withdrawal.admin_note);
                    return (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          {withdrawal.status === "pending" && (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(withdrawal.id)}
                              onChange={() => toggleSelection(withdrawal.id)}
                              className="cursor-pointer"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(withdrawal.created_at), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{withdrawal.profiles?.full_name || "N/A"}</p>
                            <p className="text-sm text-muted-foreground">{withdrawal.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">₦{Number(withdrawal.amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{bankDetails.bank_name}</p>
                            <p className="text-muted-foreground">{bankDetails.account_number}</p>
                            <p className="text-muted-foreground">{bankDetails.account_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">{withdrawal.reference || "N/A"}</span>
                        </TableCell>
                        <TableCell>
                          {withdrawal.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleProcessWithdrawal(withdrawal)}
                                disabled={processing === withdrawal.id}
                              >
                                {processing === withdrawal.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectWithdrawal(withdrawal.id)}
                                disabled={processing === withdrawal.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {withdrawal.processed_at
                                ? `Processed on ${format(new Date(withdrawal.processed_at), "MMM dd, yyyy")}`
                                : "N/A"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Confirm Withdrawal Processing
            </DialogTitle>
            <DialogDescription>
              This will initiate a Paystack transfer to the user's bank account.
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-lg font-bold">₦{Number(selectedWithdrawal.amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-lg font-semibold">{selectedWithdrawal.profiles?.full_name}</p>
                </div>
              </div>
              {(() => {
                const details = parseBankDetails(selectedWithdrawal.admin_note);
                return (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium">Bank Details:</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Bank:</span> {details.bank_name}</p>
                      <p><span className="text-muted-foreground">Account:</span> {details.account_number}</p>
                      <p><span className="text-muted-foreground">Name:</span> {details.account_name}</p>
                    </div>
                  </div>
                );
              })()}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Warning:</strong> This action will deduct ₦{Number(selectedWithdrawal.amount).toFixed(2)} from the user's wallet and initiate a transfer via Paystack. This cannot be undone.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmProcessWithdrawal}>
              Confirm & Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
