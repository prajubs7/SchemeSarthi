import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { EmptyState } from './EmptyState';

export interface ErrorStateProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ErrorState({
  message = 'Please check your internet connection and try again.',
  title = 'Something went wrong',
  onRetry,
  retryLabel = 'Try again',
  style,
  testID,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      tone="danger"
      title={title}
      subtitle={message}
      actionLabel={onRetry ? retryLabel : undefined}
      onAction={onRetry}
      style={style}
      testID={testID}
    />
  );
}
