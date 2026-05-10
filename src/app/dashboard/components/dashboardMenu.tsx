"use client";

import type { ComponentType } from "react";
import { CreditCard, LayoutDashboard, Package, User } from "lucide-react";
import { BiHealth } from "react-icons/bi";

type DashboardMenuIcon = ComponentType<{
  size?: number | string;
  className?: string;
}>;

export interface DashboardMenuItem {
  name: string;
  mobileName?: string;
  href: string;
  icon: DashboardMenuIcon;
}

export const dashboardMenu: DashboardMenuItem[] = [
  { name: "Overview", mobileName: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Health", href: "/dashboard/health", icon: BiHealth },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Orders", href: "/dashboard/orders", icon: Package },
  { name: "Subscription", mobileName: "Subscriptions", href: "/dashboard/subscription", icon: CreditCard },
];
