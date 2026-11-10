export const SCHOOL_EMAIL_DOMAIN = 'hlc.edu.hk';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isSchoolEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  const [local, domain, ...rest] = normalized.split('@');
  return rest.length === 0 && Boolean(local) && domain === SCHOOL_EMAIL_DOMAIN;
}
