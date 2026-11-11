import { formatLocal, toLocalDateInput } from "@/lib/time";

export function formatDateID(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  return formatLocal(date, {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  });
}

export function toDateInputValue(date: Date | string) {
  return toLocalDateInput(date);
}
