export interface IPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  minProfit?: number;
  volume?: number;
  crypto?: string;
  fiat?: string;
}
