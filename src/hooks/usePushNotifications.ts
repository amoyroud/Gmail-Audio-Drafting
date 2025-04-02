import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

interface PushNotificationState {
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  error: string | null;
}

export const usePushNotifications = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [state, setState] = useState<PushNotificationState>({
    permission: 'default',
    subscription: null,
    error: null
  });

  const checkPermission = useCallback(async () => {
    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        await subscribeToPushNotifications();
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
      setState(prev => ({ ...prev, error: 'Failed to check notification permission' }));
    }
  }, []);

  const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator)) {
      setState(prev => ({ ...prev, error: 'Service Worker not supported' }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
      });

      // Send subscription to backend
      const token = await getAccessTokenSilently();
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
      });

      setState(prev => ({ ...prev, subscription }));
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setState(prev => ({ ...prev, error: 'Failed to subscribe to push notifications' }));
    }
  };

  const unsubscribeFromPushNotifications = async () => {
    try {
      if (state.subscription) {
        await state.subscription.unsubscribe();
        setState(prev => ({ ...prev, subscription: null }));
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setState(prev => ({ ...prev, error: 'Failed to unsubscribe from push notifications' }));
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeNotifications = async () => {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        // Only check if we haven't already
        if (state.permission === 'default') {
          await checkPermission();
        }
      }
    };

    if (mounted) {
      initializeNotifications();
    }

    return () => {
      mounted = false;
    };
  }, [checkPermission, state.permission]);

  return {
    ...state,
    subscribe: subscribeToPushNotifications,
    unsubscribe: unsubscribeFromPushNotifications
  };
}; 