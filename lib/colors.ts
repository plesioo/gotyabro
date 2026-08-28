import type { RoleColor } from "./types";

export const ROLE_BADGE_CLASSES: Record<RoleColor, string> = {
  gray: "bg-gray-100 text-gray-700",
  red: "bg-red-100 text-red-700",
  orange: "bg-orange-100 text-orange-700",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-700",
  teal: "bg-teal-100 text-teal-700",
  blue: "bg-blue-100 text-blue-700",
  indigo: "bg-indigo-100 text-indigo-700",
  purple: "bg-purple-100 text-purple-700",
  pink: "bg-pink-100 text-pink-700",
};

export const ROLE_DOT_CLASSES: Record<RoleColor, string> = {
  gray: "bg-gray-400",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

export function badgeClass(color: string): string {
  return ROLE_BADGE_CLASSES[color as RoleColor] ?? ROLE_BADGE_CLASSES.gray;
}

export function dotClass(color: string): string {
  return ROLE_DOT_CLASSES[color as RoleColor] ?? ROLE_DOT_CLASSES.gray;
}
