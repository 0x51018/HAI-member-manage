export function parseBoolean(value: any): boolean {
  if (value === undefined || value === null) return false;
  const str = String(value).trim().toLowerCase();
  return ['o', '1', 'true', 'y', 'yes'].includes(str);
}
