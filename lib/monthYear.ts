/** The current month and year in Melbourne time, e.g. "November 2026". */
export function getCurrentMonthYear(): string {
  return new Intl.DateTimeFormat('en-AU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Australia/Melbourne',
  }).format(new Date());
}

/**
 * Frontmatter can write {monthYear} in a title or description to show the current
 * month. Pages that use it should revalidate often enough to roll over on the 1st.
 */
export function fillMonthYear(text: string): string {
  return text.includes('{monthYear}') ? text.replaceAll('{monthYear}', getCurrentMonthYear()) : text;
}
