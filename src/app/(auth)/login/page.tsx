"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, LoginInput } from "@/schemas";

const LOGO_URL = "https://res.cloudinary.com/dfmcngduw/image/upload/v1784896530/86a65215-ce9c-427d-9cc5-f67d0a08040c_gyndgk.png";

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@sktutorials.com",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || "Invalid credentials");
        toast.error(json.error || "Login failed");
        return;
      }

      toast.success("Welcome back, Admin!");
      // Full hard navigation for mobile browsers to send HTTP-only cookies
      window.location.href = "/";
    } catch (err) {
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Decor Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 rounded-3xl overflow-hidden bg-indigo-600 mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <Image
              src={LOGO_URL}
              alt="SK Tutorials Logo"
              width={64}
              height={64}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">SK Tutorials</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Tuition Fee Management System • Admin Login
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="admin@sktutorials.com"
                {...register("email")}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950/60 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600 transition-all"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950/60 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600 transition-all"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("rememberMe")}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Remember Me</span>
            </label>
            <span className="text-indigo-400 text-[11px] font-semibold hover:underline cursor-pointer">
              Forgot Password?
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <span>{isSubmitting ? "Authenticating..." : "Sign In to Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secure HTTP-Only JWT Cookie Session</span>
        </div>
      </div>
    </main>
  );
}
