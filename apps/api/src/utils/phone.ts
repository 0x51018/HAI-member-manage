export function normalizePhone(input: string): string {
  return input.replace(/[^0-9]/g, '');
}
