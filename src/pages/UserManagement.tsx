import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Trash2, Send, Eye } from "lucide-react";
import TopNav from "@/components/TopNav";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  balance: number;
  total_tickets: number;
  total_spent: number;
  total_winnings: number;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [notificationDialog, setNotificationDialog] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [notificationData, setNotificationData] = useState({ title: "", message: "" });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkAdminAndFetchUsers();
  }, []);

  const checkAdminAndFetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isAdmin = roles?.some(r => r.role === "admin");
      if (!isAdmin) {
        navigate("/");
        return;
      }

      await fetchUsers();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at");

      if (profilesError) throw profilesError;

      // Fetch wallet balances
      const { data: wallets, error: walletsError } = await supabase
        .from("wallets")
        .select("user_id, balance");

      if (walletsError) throw walletsError;

      // Fetch ticket counts and spending
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("user_id, purchase_price");

      if (ticketsError) throw ticketsError;

      // Fetch winnings
      const { data: winners, error: winnersError } = await supabase
        .from("winners")
        .select("user_id, prize_amount");

      if (winnersError) throw winnersError;

      // Combine data
      const usersData: User[] = profiles.map((profile: any) => {
        const wallet = wallets.find(w => w.user_id === profile.id);
        const userTickets = tickets.filter(t => t.user_id === profile.id);
        const userWinnings = winners.filter(w => w.user_id === profile.id);

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          balance: Number(wallet?.balance || 0),
          total_tickets: userTickets.length,
          total_spent: userTickets.reduce((sum, t) => sum + Number(t.purchase_price), 0),
          total_winnings: userWinnings.reduce((sum, w) => sum + Number(w.prize_amount), 0),
        };
      });

      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(deleteUserId);
      if (error) throw error;

      toast.success("User deleted successfully");
      setDeleteUserId(null);
      await fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleSendNotification = async () => {
    if (!notificationDialog.userId || !notificationData.title || !notificationData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { error } = await supabase.functions.invoke("send-notification", {
        body: {
          userId: notificationDialog.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: "admin_message",
        },
      });

      if (error) throw error;

      toast.success("Notification sent successfully");
      setNotificationDialog({ open: false, userId: null });
      setNotificationData({ title: "", message: "" });
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">View and manage all user accounts</p>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <Input
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Total Winnings</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.full_name || '-'}</TableCell>
                    <TableCell>₦{user.balance.toLocaleString()}</TableCell>
                    <TableCell>{user.total_tickets}</TableCell>
                    <TableCell>₦{user.total_spent.toLocaleString()}</TableCell>
                    <TableCell>₦{user.total_winnings.toLocaleString()}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setNotificationDialog({ open: true, userId: user.id })}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteUserId(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Notification Dialog */}
      <Dialog open={notificationDialog.open} onOpenChange={(open) => setNotificationDialog({ open, userId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={notificationData.title}
                onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={notificationData.message}
                onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                placeholder="Notification message"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationDialog({ open: false, userId: null })}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification} disabled={sending}>
              {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-semibold">Email:</div>
                <div>{selectedUser.email}</div>
                <div className="font-semibold">Name:</div>
                <div>{selectedUser.full_name || '-'}</div>
                <div className="font-semibold">Balance:</div>
                <div>₦{selectedUser.balance.toLocaleString()}</div>
                <div className="font-semibold">Total Tickets:</div>
                <div>{selectedUser.total_tickets}</div>
                <div className="font-semibold">Total Spent:</div>
                <div>₦{selectedUser.total_spent.toLocaleString()}</div>
                <div className="font-semibold">Total Winnings:</div>
                <div>₦{selectedUser.total_winnings.toLocaleString()}</div>
                <div className="font-semibold">Joined:</div>
                <div>{new Date(selectedUser.created_at).toLocaleString()}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedUser(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
