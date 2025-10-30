import * as Notifications from 'expo-notifications';

interface NotificationContent {
  title: string;
  body: string;
  data: Record<string, unknown>;
}

const PERMISSION_GRANTED = 'granted';

function formatCurrency(amount: string): string {
  return `$${amount}`;
}

async function scheduleImmediateNotification(
  content: NotificationContent
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      ...content,
      sound: true,
    },
    trigger: null,
  });
}

function createDepositContent(
  amount: string,
  balance: string
): NotificationContent {
  return {
    title: 'Deposit Confirmed',
    body: `${formatCurrency(amount)} has been added to your account. New balance: ${formatCurrency(balance)}`,
    data: { type: 'DEPOSIT', amount, balance },
  };
}

function createWithdrawalContent(
  amount: string,
  balance: string
): NotificationContent {
  return {
    title: 'Withdrawal Alert',
    body: `${formatCurrency(amount)} has been withdrawn from your account. Remaining balance: ${formatCurrency(balance)}`,
    data: { type: 'WITHDRAW', amount, balance },
  };
}

function createLowBalanceContent(balance: string): NotificationContent {
  return {
    title: 'Low Balance Warning',
    body: `Your balance is ${formatCurrency(balance)}`,
    data: { type: 'LOW_BALANCE', balance },
  };
}

function createDeviceVerifiedContent(): NotificationContent {
  return {
    title: '✓ Device Verified',
    body: 'Welcome back! Your device has been approved.',
    data: { type: 'DEVICE_VERIFIED' },
  };
}

function createInsufficientFundsContent(
  attemptedAmount: string,
  balance: string
): NotificationContent {
  return {
    title: 'Insufficient Funds',
    body: `Withdrawal attempt of ${formatCurrency(attemptedAmount)} failed. Available balance: ${formatCurrency(balance)}`,
    data: { type: 'INSUFFICIENT_FUNDS', attemptedAmount, balance },
  };
}

export async function showDepositNotification(
  amount: string,
  balance: string
): Promise<void> {
  const content = createDepositContent(amount, balance);
  await scheduleImmediateNotification(content);
}

export async function showWithdrawalNotification(
  amount: string,
  balance: string
): Promise<void> {
  const content = createWithdrawalContent(amount, balance);
  await scheduleImmediateNotification(content);
}

export async function showLowBalanceNotification(
  balance: string
): Promise<void> {
  const content = createLowBalanceContent(balance);
  await scheduleImmediateNotification(content);
}

export async function showDeviceVerifiedNotification(): Promise<void> {
  const content = createDeviceVerifiedContent();
  await scheduleImmediateNotification(content);
}

export async function showInsufficientFundsNotification(
  attemptedAmount: string,
  balance: string
): Promise<void> {
  const content = createInsufficientFundsContent(attemptedAmount, balance);
  await scheduleImmediateNotification(content);
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === PERMISSION_GRANTED;
}
