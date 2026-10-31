type NotificationStorage = Pick<Storage, 'getItem' | 'setItem'>;

// Store only the sale identifier, never customer data or notification contents.
export function claimSaleNotification(storage: NotificationStorage, userId: string, saleId: string): boolean {
  if (!userId || !saleId) return false;
  const key = `sale-notified:v1:${userId}:${saleId}`;
  if (storage.getItem(key)) return false;
  storage.setItem(key, '1');
  return true;
}