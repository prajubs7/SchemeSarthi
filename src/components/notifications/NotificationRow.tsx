import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Card,
  IconCircle,
  IconName,
  Tone,
} from '../ui';
import { colors, sizes, spacing } from '../../theme';
import { AppNotification, NotificationType } from '../../types/notification';
import { formatRelativeTime } from '../../utils/relativeTime';

export const NOTIFICATION_STYLE: Record<
  NotificationType,
  { icon: IconName; tone: Tone }
> = {
  new_match: { icon: 'sparkles', tone: 'success' },
  deadline_soon: { icon: 'time-outline', tone: 'warning' },
  newly_launched: { icon: 'rocket-outline', tone: 'accent' },
  scheme_updated: { icon: 'refresh', tone: 'info' },
};

export interface NotificationRowProps {
  notification: AppNotification;
  /** Top border, for rows stacked inside one card. */
  divider?: boolean;
  onPress: () => void;
}

export default function NotificationRow({
  notification,
  divider = false,
  onPress,
}: NotificationRowProps) {
  const style =
    NOTIFICATION_STYLE[notification.notification_type] ??
    NOTIFICATION_STYLE.scheme_updated;
  const unread = !notification.is_read;
  const when = formatRelativeTime(notification.created_at);
  return (
    <Card
      variant="outlined"
      padding="md"
      onPress={onPress}
      accessibilityLabel={`${unread ? 'Unread. ' : ''}${
        notification.change_summary
      }, ${when}`}
      accessibilityHint={
        notification.scheme_id ? 'Opens the scheme' : 'Marks as read'
      }
      style={[styles.row, divider && styles.divider]}
    >
      <IconCircle icon={style.icon} tone={style.tone} size="sm" />
      <View style={styles.text}>
        <AppText
          variant="bodySm"
          weight={unread ? '600' : undefined}
          numberOfLines={2}
        >
          {notification.change_summary}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {when}
        </AppText>
      </View>
      {unread ? <View style={styles.unreadDot} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 0,
    borderRadius: 0,
  },
  divider: {
    borderTopWidth: sizes.borderWidth,
    borderTopColor: colors.border,
  },
  text: { flex: 1, gap: spacing.xs / 2 },
  unreadDot: {
    width: sizes.dot,
    height: sizes.dot,
    borderRadius: sizes.dot / 2,
    backgroundColor: colors.accent,
  },
});
