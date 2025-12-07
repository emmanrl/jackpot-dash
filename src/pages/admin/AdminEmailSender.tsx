import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminEmailSender() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    recipients: "all",
    customEmail: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .order("created_at", { ascending: false });
    
    if (data) {
      setUsers(data);
    }
  };

  const handleSendEmail = async () => {
    if (!formData.subject || !formData.message) {
      toast.error("Please fill in subject and message");
      return;
    }

    setLoading(true);
    try {
      let recipientEmails: string[] = [];

      if (formData.recipients === "all") {
        recipientEmails = users.map(u => u.email);
      } else if (formData.recipients === "custom") {
        recipientEmails = formData.customEmail
          .split(",")
          .map(e => e.trim())
          .filter(e => e);
      } else {
        const user = users.find(u => u.id === formData.recipients);
        if (user) recipientEmails = [user.email];
      }

      if (recipientEmails.length === 0) {
        toast.error("No recipients selected");
        return;
      }

      // Call edge function to send emails
      const { error } = await supabase.functions.invoke("send-admin-email", {
        body: {
          recipients: recipientEmails,
          subject: formData.subject,
          message: formData.message,
        },
      });

      if (error) throw error;

      toast.success(`Email sent to ${recipientEmails.length} recipient(s)`);
      setFormData({
        recipients: "all",
        customEmail: "",
        subject: "",
        message: "",
      });
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <div>
            <CardTitle>Send Email to Users</CardTitle>
            <CardDescription>Send announcements and notifications to your users</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="recipients">Recipients</Label>
          <Select
            value={formData.recipients}
            onValueChange={(value) => setFormData({ ...formData, recipients: value })}
          >
            <SelectTrigger id="recipients" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users ({users.length})</SelectItem>
              <SelectItem value="custom">Custom Email Addresses</SelectItem>
              {users.slice(0, 20).map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.recipients === "custom" && (
          <div>
            <Label htmlFor="customEmail">Email Addresses</Label>
            <Input
              id="customEmail"
              value={formData.customEmail}
              onChange={(e) => setFormData({ ...formData, customEmail: e.target.value })}
              placeholder="email1@example.com, email2@example.com"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate multiple emails with commas
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Email subject"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Your message here..."
            className="mt-2 min-h-[200px]"
          />
        </div>

        <Button
          onClick={handleSendEmail}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Email
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
