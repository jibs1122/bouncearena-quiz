import { getCurrentMonthYear } from '@/lib/monthYear';

/** Renders the current month and year inside MDX copy, e.g. "November 2026". */
export default function MonthYear() {
  return <>{getCurrentMonthYear()}</>;
}
