const UK_PHONE_REGEX = /^(\+44|0)[\d\s]{10,12}$/;

export function isValidUKPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return UK_PHONE_REGEX.test(cleaned);
}

export function formatUKPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+44')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+44' + cleaned.slice(1);
  }
  return cleaned;
}
