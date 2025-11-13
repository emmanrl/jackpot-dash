import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Badge } from '@/components/ui/badge';

export default function NotificationSettings() {
  const { permission, isSupported, requestPermission, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Your browser does not support push notifications
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get instant notifications about draws, wins, and updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Browser Notifications</p>
            <p className="text-xs text-muted-foreground">
              Receive real-time updates even when the app is closed
            </p>
          </div>
          <Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
            {permission === 'granted' ? 'Enabled' : 
             permission === 'denied' ? 'Blocked' : 'Not Set'}
          </Badge>
        </div>
        
        {permission === 'granted' ? (
          <Button 
            onClick={unsubscribe} 
            variant="outline" 
            className="w-full"
          >
            <BellOff className="mr-2 h-4 w-4" />
            Disable Notifications
          </Button>
        ) : permission === 'denied' ? (
          <p className="text-sm text-muted-foreground">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        ) : (
          <Button 
            onClick={requestPermission} 
            className="w-full"
          >
            <Bell className="mr-2 h-4 w-4" />
            Enable Notifications
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
