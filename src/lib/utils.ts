import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  // Format in Botswana Pula (BWP) with a simple "P" prefix.
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `P${safeAmount.toFixed(2)}`;
}
