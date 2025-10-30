import * as Notifications from 'expo-notifications';

export async function showDepositNotification(
  amount: string,
  balance: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Deposit Confirmed',
      body: `$${amount} has been added to your account. New balance: $${balance}`,
      data: { type: 'DEPOSIT', amount, balance },
      sound: true,
    },
    trigger: null,
  });
}

export async function showWithdrawalNotification(
  amount: string,
  balance: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Withdrawal Alert',
      body: `$${amount} has been withdrawn from your account. Remaining balance: $${balance}`,
      data: { type: 'WITHDRAW', amount, balance },
      sound: true,
    },
    trigger: null,
  });
}

export async function showLowBalanceNotification(
  balance: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Low Balance Warning',
      body: `Your balance is $${balance}`,
      data: { type: 'LOW_BALANCE', balance },
      sound: true,
    },
    trigger: null,
  });
}

export async function showDeviceVerifiedNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Device Verified',
      body: 'Your device has been verified! You can now access your account.',
      data: { type: 'DEVICE_VERIFIED' },
      sound: true,
    },
    trigger: null,
  });
}

export async function showInsufficientFundsNotification(
  attemptedAmount: string,
  balance: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Insufficient Funds',
      body: `Withdrawal attempt of $${attemptedAmount} failed. Available balance: $${balance}`,
      data: { type: 'INSUFFICIENT_FUNDS', attemptedAmount, balance },
      sound: true,
    },
    trigger: null,
  });
}

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
