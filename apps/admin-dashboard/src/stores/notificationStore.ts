import { create } from 'zustand';
import type { Notification, NotificationType } from '../types';
import { NOTIFICATION_DURATION } from '../utils/constants';

/**
 * Notification Store
 * Manages toast notifications and alerts
 */

interface NotificationState {
  // State
  notifications: Notification[];

  // Actions
  addNotification: (
    type: NotificationType,
    message: string,
    title?: string,
    duration?: number
  ) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;

  // Convenience methods
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  // Initial State
  notifications: [],

  // Add Notification
  addNotification: (
    type: NotificationType,
    message: string,
    title?: string,
    duration: number = NOTIFICATION_DURATION.medium
  ) => {
    const notification: Notification = {
      id: `notification-${Date.now()}-${Math.random()}`,
      type,
      message,
      title,
      duration,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Auto-remove after duration (if not persistent)
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== notification.id),
        }));
      }, duration);
    }
  },

  // Remove Notification
  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  // Clear All Notifications
  clearAll: () => {
    set({ notifications: [] });
  },

  // Convenience Methods
  success: (message: string, title?: string) => {
    useNotificationStore.getState().addNotification('success', message, title);
  },

  error: (message: string, title?: string) => {
    useNotificationStore.getState().addNotification(
      'error',
      message,
      title,
      NOTIFICATION_DURATION.long
    );
  },

  warning: (message: string, title?: string) => {
    useNotificationStore.getState().addNotification('warning', message, title);
  },

  info: (message: string, title?: string) => {
    useNotificationStore.getState().addNotification('info', message, title);
  },
}));

// Selector hooks
export const useNotifications = () =>
  useNotificationStore((state) => state.notifications);
export const useNotificationActions = () => ({
  success: useNotificationStore((state) => state.success),
  error: useNotificationStore((state) => state.error),
  warning: useNotificationStore((state) => state.warning),
  info: useNotificationStore((state) => state.info),
  remove: useNotificationStore((state) => state.removeNotification),
  clearAll: useNotificationStore((state) => state.clearAll),
});
