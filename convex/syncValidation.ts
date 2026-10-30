export function validMs(n: number): boolean {
  return Number.isSafeInteger(n) && n >= 0 && n <= 86_400_000;
}

export function validDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const value = new Date(Date.UTC(y, m - 1, d));
  return value.getUTCFullYear() === y && value.getUTCMonth() === m - 1 && value.getUTCDate() === d;
}

export function validDomain(domain: string): boolean {
  return domain.length <= 253 && /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(domain);
}

export function validDeviceId(deviceId: string): boolean {
  return /^[a-zA-Z0-9_-]{16,64}$/.test(deviceId);
}
