import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
          )
        });

        // Save subscription to database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('push_subscriptions').upsert([{
            user_id: user.id,
            subscription: subscription.toJSON() as any,
          }]);
        }

        toast.success('Push notifications enabled!');
        return true;
      } else if (result === 'denied') {
        toast.error('Push notifications were blocked');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable push notifications');
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          
          // Remove from database
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
          }
          
          toast.success('Push notifications disabled');
        }
      }
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      toast.error('Failed to disable push notifications');
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    unsubscribe,
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
