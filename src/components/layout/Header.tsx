"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Sun,
  Moon,
  Laptop,
  LogOut,
  PlusCircle,
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface HeaderProps {
  onOpenQuickCollect?: () => void;
  onOpenAddStudent?: () => void;
  onSearchChange?: (val: string) => void;
}

const LOGO_URL = "https://res.cloudinary.com/dfmcngduw/image/upload/v1784896530/86a65215-ce9c-427d-9cc5-f67d0a08040c_gyndgk.png";

export function Header({
  onOpenQuickCollect,
  onOpenAddStudent,
  onSearchChange,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Logged out successfully");
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearchChange) onSearchChange(val);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border transition-colors">
      {/* Left: Mobile Brand & Instant Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="flex items-center gap-2 md:hidden">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-indigo-600 flex items-center justify-center text-white">
            <Image
              src={LOGO_URL}
              alt="SK Tutorials Logo"
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="font-bold text-sm tracking-tight">SK Tutorials</span>
        </div>

        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students, mobile, receipts... (Press /)"
            value={searchValue}
            onChange={handleSearchInput}
            suppressHydrationWarning
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-muted/60 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* Right: Actions & Theme Toggle & Admin Profile */}
      <div className="flex items-center gap-2">
        {/* Quick Actions Buttons */}
        {onOpenQuickCollect && (
          <button
            onClick={onOpenQuickCollect}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Collect Fee</span>
          </button>
        )}

        {/* Theme Switcher */}
        <div className="flex items-center bg-muted/80 p-1 rounded-xl border border-border/60" suppressHydrationWarning>
          <button
            onClick={() => setTheme("light")}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              mounted && theme === "light" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            }`}
            title="Light Theme"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              mounted && theme === "dark" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            }`}
            title="Dark Theme"
          >
            <Moon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme("system")}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              mounted && theme === "system" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            }`}
            title="System Theme"
          >
            <Laptop className="w-4 h-4" />
          </button>
        </div>

        {/* Admin Profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/60">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
            <User className="w-4 h-4" />
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-muted-foreground hover:text-rose-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
