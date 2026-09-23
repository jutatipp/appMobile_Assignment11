import { useEffect } from 'react';
import { router, useRootNavigationState } from 'expo-router';
import * as Notifications from 'expo-notifications';
import '../services/notifications';

export function NotificationObserver() {
  const navigation = useRootNavigationState();
  useEffect(() => {
    if (!navigation?.key) return;
    let lastHandled = '';
    function open(response: Notifications.NotificationResponse | null) {
      if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER)
        return;
      const requestId = `${response.notification.request.identifier}:${response.notification.date}`;
      if (requestId === lastHandled) return;
      const id = response.notification.request.content.data?.eventId;
      if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) return;
      lastHandled = requestId;
      router.push({ pathname: '/events/[id]', params: { id } });
      void Notifications.clearLastNotificationResponseAsync().catch(() => {});
    }
    void Notifications.getLastNotificationResponseAsync()
      .then(open)
      .catch(() => {});
    const listener = Notifications.addNotificationResponseReceivedListener(open);
    return () => listener.remove();
  }, [navigation?.key]);
  return null;
}
