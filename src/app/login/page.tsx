"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Camera,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  Sparkles,
} from "lucide-react";
import ShutterScapeLogo from "@/components/ShutterScapeLogo";
import Footer from "@/components/Footer";

type Role = "admin" | "executive";

interface SessionData {
  authenticated: boolean;
  user: {
    id?: string;
    email: string;
    role: Role;
    name: string;
    authProvider?: "supabase" | "local";
    accountStatus?: "active" | "disabled";
  } | null;
  authProvider?: "supabase" | "local" | "none";
  backendStatus?: {
    supabaseConfigured: boolean;
    adminConfigured?: boolean;
    execConfigured?: boolean;
    anyConfigured?: boolean;
    activeProvider?: "supabase" | "local" | "none";
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation & UI states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverNotice, setServerNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Authenticated state
  const [session, setSession] = useState<SessionData>({
    authenticated: false,
    user: null,
  });
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Check current session and backend status on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data: SessionData = await res.json();
          setSession(data);

          if (data.backendStatus) {
            if (data.backendStatus.supabaseConfigured) {
              setServerNotice(null);
            } else {
              setServerNotice(
                "Supabase Authentication credentials have not been configured in server environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setIsLoadingSession(false);
      }
    }

    checkSession();
  }, []);

  // Handle switching tabs for unauthenticated form
  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setServerError(null);
    setEmailError(null);
    setPasswordError(null);

    if (session.backendStatus && !session.backendStatus.supabaseConfigured) {
      setServerNotice(
        "Supabase Authentication credentials have not been configured in server environment variables (.env.local)."
      );
    } else {
      setServerNotice(null);
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Client-side validations
    let hasError = false;

    if (!email.trim()) {
      setEmailError("Email address is required.");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError("Password is required.");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (hasError) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setServerError(
          data.error ||
            "Authentication failed. Please verify your credentials and try again."
        );
        return;
      }

      // Success: update session
      setSession({
        authenticated: true,
        user: data.user,
      });
      setPassword("");
      router.push("/dashboard");
    } catch {
      setServerError(
        "A network or server error occurred. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logout handler with resilient loading and error states
  const handleLogout = async () => {
    setIsLoggingOut(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setSession({
          authenticated: false,
          user: null,
        });
        setEmail("");
        setPassword("");
      } else {
        setServerError("Failed to sign out. Please try again.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      setServerError("Network error during sign out.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // =========================================================================
  // VIEW 1: AUTHENTICATED SESSION WELCOME PAGE (MOBILE-FIRST REDESIGN)
  // =========================================================================
  if (session.authenticated && session.user) {
    const isAdmin = session.user.role === "admin";
    const roleLabel = isAdmin ? "Administrator" : "Executive Member";
    const greetingName =
      session.user.name && session.user.name.trim().length > 0
        ? session.user.name
        : isAdmin
        ? "Club Administrator"
        : "Executive Member";

    return (
      <div className="min-h-screen bg-[#08090A] text-[#F5F5F3] flex flex-col font-sans selection:bg-white selection:text-black">
        {/* A. Compact Brand Header with Small Role Indicator (Zero Mobile Overflow) */}
        <header className="w-full px-3.5 sm:px-6 py-3 border-b border-white/10 bg-[#08090A]/90 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2.5">
            <Link
              href="/"
              className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-md"
              aria-label="ShutterScape Home"
            >
              <ShutterScapeLogo height={28} priority />
            </Link>

            {/* Small Clearly Visible Role Indicator */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-mono font-medium border border-white/15 bg-white/[0.04] text-[#E0E2E6] shadow-sm">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"
                  aria-hidden="true"
                />
                <span className="uppercase tracking-wider">{roleLabel}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Mobile-first Welcome & Session Main Surface */}
        <main className="flex-1 flex flex-col items-center justify-center px-3.5 sm:px-6 py-6 sm:py-12 relative overflow-hidden pb-[max(2rem,env(safe-area-inset-bottom))]">
          {/* Subtle Ambient Monochrome Glow */}
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="w-full max-w-lg mx-auto relative z-10 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            {/* Feedback Alert if Error Occurred */}
            {serverError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <p className="flex-1 leading-snug">{serverError}</p>
              </div>
            )}

            {/* B. Welcome Section */}
            <div className="space-y-2 text-left">
              <div className="inline-flex items-center gap-1.5 text-neutral-400 text-[11px] font-mono uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-white" />
                <span>
                  {isAdmin
                    ? "Club Administrator Portal"
                    : "Executive Operations Portal"}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Welcome, {greetingName}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                {isAdmin
                  ? "You have verified administrator privileges to oversee club activities, curate galleries, manage committee members, and monitor administrative logs."
                  : "You have verified executive access to publish club activities, curate photographic highlights, and update member records."}
              </p>
            </div>

            {/* C. Session & Account Status (Verified Real Data Only) */}
            <div className="w-full rounded-2xl bg-[#111315] border border-white/10 p-4 sm:p-5 shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Account Status
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Active</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Authorized Role */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-400">
                    Authorized Role
                  </span>
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span>{roleLabel}</span>
                  </div>
                </div>

                {/* Authentication Provider */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-400">
                    Security Provider
                  </span>
                  <div className="font-mono text-neutral-300">
                    {session.user.authProvider === "supabase"
                      ? "Supabase Auth"
                      : "Verified Session"}
                  </div>
                </div>
              </div>

              {/* Signed In As Email */}
              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="text-[10px] font-mono uppercase text-neutral-400">
                  Signed In As
                </span>
                <span className="font-mono text-[#F5F5F3] truncate max-w-full sm:max-w-xs">
                  {session.user.email}
                </span>
              </div>
            </div>

            {/* D. Primary Action (Prominent, Accessible Full-Width CTA) */}
            <div className="pt-1">
              <Link
                href="/dashboard"
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl text-sm sm:text-base transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.12)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <span>Open Content Management</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* E. Secondary Actions (Structured, Non-Competing Layout) */}
            <div className="space-y-2.5">
              {isAdmin ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                  <Link
                    href="/dashboard?tab=activity"
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#17191C] hover:bg-[#202327] text-[#D5D9DE] hover:text-white border border-[#303338] hover:border-white/30 px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Review Activity Logs</span>
                  </Link>
                  <Link
                    href="/"
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#17191C] hover:bg-[#202327] text-[#D5D9DE] hover:text-white border border-[#303338] hover:border-white/30 px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors"
                  >
                    <span>View Public Website</span>
                  </Link>
                </div>
              ) : (
                <div className="w-full">
                  <Link
                    href="/"
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#17191C] hover:bg-[#202327] text-[#D5D9DE] hover:text-white border border-[#303338] hover:border-white/30 px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors"
                  >
                    <span>View Public Website</span>
                  </Link>
                </div>
              )}

              {/* Secure Sign Out Button */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#111315] hover:bg-rose-500/10 text-neutral-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: UNAUTHENTICATED LOGIN EXPERIENCE (RESPONSIVE & OVERFLOW-SAFE)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F3] flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Top Header Bar (Zero Horizontal Overflow at 320px) */}
      <header className="w-full px-3.5 sm:px-8 py-3.5 border-b border-[#303338]/60 bg-[#08090A]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <Link
              href="/"
              className="flex items-center group/brand focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 rounded-md shrink-0"
              aria-label="ShutterScape Home"
            >
              <ShutterScapeLogo
                height={28}
                priority
                className="transition-transform group-hover/brand:scale-105"
              />
            </Link>
            <div
              className="hidden sm:block h-5 w-px bg-white/15 shrink-0"
              aria-hidden="true"
            />
            <a
              href="https://gcuniversity.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit the official GCU website"
              title="Girijananda Chowdhury University (Official Website)"
              className="hidden sm:flex items-center group/gcu focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 rounded-md transition-opacity hover:opacity-90 shrink-0"
            >
              <div className="relative h-[26px] w-[72px] sm:h-[32px] sm:w-[84px]">
                <Image
                  src="/images/gcu-logo-white-footer.png"
                  alt="Girijananda Chowdhury University"
                  fill
                  priority
                  sizes="(max-width: 640px) 72px, 84px"
                  className="object-contain object-left transition-transform group-hover/gcu:scale-105"
                />
              </div>
            </a>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#B5B8BC] hover:text-white transition-colors group px-3 py-1.5 rounded-full hover:bg-white/[0.04] border border-transparent hover:border-[#303338] shrink-0 min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>
              Back<span className="hidden xs:inline"> to Website</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main Login Experience */}
      <main className="flex-1 flex items-center justify-center px-3.5 sm:px-6 py-6 sm:py-16 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl sm:rounded-3xl border border-[#303338] bg-[#111315]/90 backdrop-blur-2xl shadow-2xl shadow-black/90 overflow-hidden">
          {/* Left Column: Cinematic Photography Showcase (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-8 xl:p-10 border-r border-[#303338] bg-black/60 overflow-hidden">
            {/* Background Photographic Image */}
            <div className="absolute inset-0">
              <Image
                src="/images/through-viewfinder.jpg"
                alt="Photography camera viewfinder perspective — ShutterScape GCU"
                fill
                priority
                sizes="500px"
                className="object-cover opacity-45 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08090A] via-[#08090A]/60 to-black/70" />
              <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80" />
            </div>

            {/* Top Badge */}
            <div className="relative z-10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#D5D9DE]">
                Restricted Access Portal
              </span>
            </div>

            {/* Middle Editorial Quote */}
            <div className="relative z-10 my-auto py-12">
              <div className="w-10 h-0.5 bg-white mb-6" />
              <blockquote className="text-xl xl:text-2xl font-serif italic text-white/95 leading-relaxed">
                &ldquo;Every frame captures a fragment of truth, every story deepens our perspective.&rdquo;
              </blockquote>
              <p className="mt-4 text-xs font-mono text-[#858A91]">
                — ShutterScape Leadership &amp; Operations
              </p>
            </div>

            {/* Bottom Meta Information */}
            <div className="relative z-10 pt-6 border-t border-[#303338]/60 flex items-center justify-between text-[11px] text-[#858A91]">
              <div className="flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-[#B5B8BC]" />
                <span>GCU Photography Club</span>
              </div>
              <span className="font-mono">Hatkhowapara, Azara</span>
            </div>
          </div>

          {/* Right Column: Switchable Login Panel */}
          <div className="lg:col-span-7 p-4 sm:p-8 xl:p-12 flex flex-col justify-center">
            {/* Unauthenticated Login Form */}
            <div className="space-y-6">
              {/* Header Title */}
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#858A91] block mb-1">
                  GCU Photography Club
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F5F3]">
                  Leadership Portal
                </h1>
                <p className="text-xs sm:text-sm text-[#858A91] mt-1.5 leading-relaxed">
                  Authorized sign-in for Club Administrators and Executive Members.
                </p>
              </div>

              {/* Role Selection Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#08090A] border border-[#303338]">
                <button
                  type="button"
                  onClick={() => handleRoleChange("admin")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                    selectedRole === "admin"
                      ? "bg-white text-black shadow-md shadow-white/5"
                      : "text-[#858A91] hover:text-[#D5D9DE] hover:bg-white/[0.04]"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Administrator</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("executive")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                    selectedRole === "executive"
                      ? "bg-white text-black shadow-md shadow-white/5"
                      : "text-[#858A91] hover:text-[#D5D9DE] hover:bg-white/[0.04]"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Executive Member</span>
                </button>
              </div>

              {/* Server Notice Banner */}
              {serverNotice && (
                <div
                  role="status"
                  className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5"
                >
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <p className="flex-1 leading-relaxed">{serverNotice}</p>
                </div>
              )}

              {/* Server Error Banner */}
              {serverError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <p className="flex-1 leading-relaxed">{serverError}</p>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-medium text-[#D5D9DE]"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#858A91]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      placeholder={
                        selectedRole === "admin"
                          ? "admin@shutterscape.gcu"
                          : "executive@shutterscape.gcu"
                      }
                      autoComplete="email"
                      required
                      className={`w-full pl-9 pr-3 py-2.5 bg-[#08090A] border rounded-xl text-sm text-[#F5F5F3] placeholder-[#858A91]/60 focus:outline-none transition-colors ${
                        emailError
                          ? "border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30"
                          : "border-[#303338] focus:border-white focus:ring-1 focus:ring-white/30"
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-rose-400 mt-1">{emailError}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-[#D5D9DE]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#858A91]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      required
                      className={`w-full pl-9 pr-10 py-2.5 bg-[#08090A] border rounded-xl text-sm text-[#F5F5F3] placeholder-[#858A91]/60 focus:outline-none transition-colors ${
                        passwordError
                          ? "border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30"
                          : "border-[#303338] focus:border-white focus:ring-1 focus:ring-white/30"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#858A91] hover:text-[#D5D9DE] focus:outline-none cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-rose-400 mt-1">{passwordError}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoadingSession}
                    className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-[#D5D9DE] text-[#08090A] font-semibold py-3 px-4 rounded-xl text-sm shadow-lg shadow-white/5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          Sign In as{" "}
                          {selectedRole === "admin"
                            ? "Administrator"
                            : "Executive Member"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
