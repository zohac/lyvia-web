import type { DeviceType } from '../api/analytics.contract'

export function detectDeviceType(userAgent: string): DeviceType {
  if (/iPad|Android(?!.*Mobile)|tablet/i.test(userAgent)) return 'tablet'
  if (/Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

export function detectBrowser(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return 'Edge'
  if (/OPR\//i.test(userAgent)) return 'Opera'
  if (/Chrome\//i.test(userAgent)) return 'Chrome'
  if (/Firefox\//i.test(userAgent)) return 'Firefox'
  if (/Safari\//i.test(userAgent)) return 'Safari'
  return 'Other'
}
