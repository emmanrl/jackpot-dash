import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { permission, isSupported, requestPermission } = usePushNotifications();

  useEffect(() => {
    // Show prompt after 5 seconds if notifications are supported and not yet decided
    const timer = setTimeout(() => {
      if (isSupported && permission === 'default') {
        const dismissed = localStorage.getItem('notificationPromptDismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isSupported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-fade-in">
      <Card className="border-primary shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Stay Updated!</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription>
            Get instant notifications about upcoming draws, wins, and important updates
          </CardDescription>
          <div className="flex gap-2">
            <Button onClick={handleEnable} className="flex-1">
              Enable Notifications
            </Button>
            <Button variant="outline" onClick={handleDismiss} className="flex-1">
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
