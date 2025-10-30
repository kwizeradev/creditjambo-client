import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification, { NotificationType } from '@/components/Notification';

interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (
    type: NotificationType,
    title: string,
    message: string,
    duration?: number
  ) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = (
    type: NotificationType,
    title: string,
    message: string,
    duration = 4000
  ) => {
    const id = Date.now().toString();
    const newNotification: NotificationData = {
      id,
      type,
      title,
      message,
      duration,
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 2)]);
  };

  const hideNotification = (id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  return (
    <NotificationContext.Provider
      value={{ showNotification, hideNotification }}
    >
      {children}
      {notifications.map((notification, index) => (
        <Notification
          key={notification.id}
          visible={true}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
}
