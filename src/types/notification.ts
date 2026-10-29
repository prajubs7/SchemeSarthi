export type NotificationType =
  | 'new_match'
  | 'deadline_soon'
  | 'newly_launched'
  | 'scheme_updated';

// Rows written by supabase/functions/generate-awareness-digest.
export interface AppNotification {
  id: string;
  user_id: string;
  scheme_id: string | null;
  notification_type: NotificationType;
  change_summary: string;
  is_read: boolean;
  created_at: string;
}
