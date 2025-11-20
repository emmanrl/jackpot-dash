import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  admin_id: string;
  action_type: string;
  action_description: string;
  target_id: string | null;
  target_type: string | null;
  metadata: any;
  created_at: string;
  admin_email?: string;
}

export const AdminActivityLog = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data: logsData, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch admin emails
      const adminIds = [...new Set(logsData.map(log => log.admin_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', adminIds);

      const emailMap = profilesData?.reduce((acc, profile) => {
        acc[profile.id] = profile.email;
        return acc;
      }, {} as Record<string, string>) || {};

      const logsWithEmails = logsData.map(log => ({
        ...log,
        admin_email: emailMap[log.admin_id]
      }));

      setLogs(logsWithEmails);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'jackpot_created':
      case 'user_created':
        return 'default';
      case 'jackpot_updated':
      case 'user_updated':
      case 'settings_updated':
        return 'secondary';
      case 'jackpot_deleted':
      case 'user_deleted':
        return 'destructive';
      case 'transaction_approved':
      case 'withdrawal_processed':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Activity Log</CardTitle>
          <CardDescription>Track all administrative actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Activity Log</CardTitle>
        <CardDescription>Recent administrative actions and changes</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No activity logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-sm">{log.admin_email}</TableCell>
                    <TableCell>
                      <Badge variant={getActionColor(log.action_type)}>
                        {log.action_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.action_description}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
