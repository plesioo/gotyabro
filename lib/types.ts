import type { ActivityType } from "./activity";

export const ROLE_COLORS = [
  "gray",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "indigo",
  "purple",
  "pink",
] as const;

export type RoleColor = (typeof ROLE_COLORS)[number];

export type RoleBadge = {
  id: string;
  name: string;
  color: RoleColor;
};

export type Role = RoleBadge & {
  memberCount: number;
  createdAt: string;
};

export type MemberWithRoles = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  roles: RoleBadge[];
};

export type Activity = {
  id: string;
  type: ActivityType;
  message: string;
  createdAt: string;
};

export type Insights = {
  memberCount: number;
  roleCount: number;
  addedThisMonth: number;
};

export type ActionState = {
  error?: string;
  ok?: boolean;
} | null;
