import React from 'react';
import { EmptyState, Screen } from '../../components/ui';

// Placeholder until Step 10 adds notificationsApi and useNotifications.
export default function NotificationsScreen() {
  return (
    <Screen>
      <EmptyState
        icon="notifications-outline"
        title="You're all caught up"
        subtitle="New matches and scheme updates will show up here."
      />
    </Screen>
  );
}
