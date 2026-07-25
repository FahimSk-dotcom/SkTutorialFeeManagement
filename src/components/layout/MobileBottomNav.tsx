"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ReceiptText,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Expenses", href: "/expenses", icon: ReceiptText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-t border-border px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition-all duration-200 ${
                isActive ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-muted-foreground"
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-all ${
                  isActive ? "bg-indigo-600/10 dark:bg-indigo-500/20" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
