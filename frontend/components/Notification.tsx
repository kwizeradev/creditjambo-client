import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/configs';

const { width } = Dimensions.get('window');

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  visible: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  duration = 4000,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideNotification();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideNotification();
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          background: '#10b981',
          border: '#059669',
          icon: '#ffffff',
          text: '#ffffff',
        };
      case 'error':
        return {
          background: '#ef4444',
          border: '#dc2626',
          icon: '#ffffff',
          text: '#ffffff',
        };
      case 'warning':
        return {
          background: '#f59e0b',
          border: '#d97706',
          icon: '#ffffff',
          text: '#ffffff',
        };
      case 'info':
      default:
        return {
          background: '#3b82f6',
          border: '#2563eb',
          icon: '#ffffff',
          text: '#ffffff',
        };
    }
  };

  if (!visible) return null;

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={getIconName()}
          size={24}
          color={colors.icon}
          style={styles.icon}
        />

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.text }]}>
            {message}
          </Text>
        </View>

        <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default Notification;
