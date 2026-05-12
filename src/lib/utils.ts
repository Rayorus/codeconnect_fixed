import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getDifficultyColor(difficulty: "Easy" | "Medium" | "Hard") {
  switch (difficulty) {
    case "Easy":
      return "text-lc-easy";
    case "Medium":
      return "text-lc-medium";
    case "Hard":
      return "text-lc-hard";
  }
}

export function getProgressPercent(solved: number, total: number) {
  if (total === 0) return 0;
  return Math.round((solved / total) * 100);
}

export function generateUsername(email: string): string {
  return email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
}
