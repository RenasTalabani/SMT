/** "beginner" -> "Beginner"; safe for missing values (returns ""). */
export function capitalize(value: string | null | undefined): string {
  if (!value) return '';
  const text = String(value).replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
