"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Check, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { signUpSchema, signUpWithEmail, type SignUpInput } from "@skilltego/auth";
import { Button, Input, Label } from "@skilltego/ui";
import { cn } from "@skilltego/utils";
import { createClient } from "@/lib/supabase/browser";
import { trackEvent } from "@/providers/posthog-provider";
import { OAuthButtons } from "./oauth-buttons";

type PasswordStrength = "Weak" | "Medium" | "Strong";

const STRENGTH_STYLE: Record<PasswordStrength, { bar: string; text: string }> = {
  Weak: { bar: "bg-destructive", text: "text-destructive" },
  Medium: { bar: "bg-warning", text: "text-warning" },
  Strong: { bar: "bg-success", text: "text-success" },
};

function getPasswordStrength(password: string): { label: PasswordStrength; filled: number } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", filled: 1 };
  if (score <= 4) return { label: "Medium", filled: 2 };
  return { label: "Strong", filled: 3 };
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") ?? undefined;
  const [formError, setFormError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [capsLockOn, setCapsLockOn] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  const agreedToTerms = watch("agreedToTerms");
  const passwordValue = watch("password") ?? "";
  const confirmPasswordValue = watch("confirmPassword") ?? "";
  const passwordsMatch = confirmPasswordValue.length > 0 && passwordValue === confirmPasswordValue;
  const strength = passwordValue ? getPasswordStrength(passwordValue) : null;

  function handleCapsLockCheck(e: React.KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(e.getModifierState?.("CapsLock") ?? false);
  }

  async function onSubmit(values: SignUpInput) {
    setFormError(null);
    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent("/onboarding")}`;

    const { data, error } = await signUpWithEmail(supabase, {
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      emailRedirectTo,
      referralCode,
      agreedToTerms: values.agreedToTerms,
    });

    if (error) {
      setFormError(
        error.message === "User already registered"
          ? "An account with this email already exists."
          : error.message,
      );
      return;
    }

    trackEvent("user_signed_up", { method: "email" });

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5 text-center">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Every skill deserves an opportunity. Let&apos;s find yours.
        </p>
      </div>

      <OAuthButtons redirectTo="/onboarding" />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" {...register("fullName")} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="pl-9"
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="dateOfBirth" type="date" className="pl-9" {...register("dateOfBirth")} />
          </div>
          {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="pl-9 pr-10"
              onKeyUp={handleCapsLockCheck}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {capsLockOn && <p className="text-xs text-warning">Caps Lock is on</p>}
          {strength && (
            <div className="grid gap-1">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-200",
                      i < strength.filled ? STRENGTH_STYLE[strength.label].bar : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <p className={cn("text-xs font-medium", STRENGTH_STYLE[strength.label].text)}>
                {strength.label} password
              </p>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              className={cn("pl-9", passwordsMatch ? "pr-16" : "pr-10")}
              onKeyUp={handleCapsLockCheck}
              {...register("confirmPassword")}
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
              {passwordsMatch && <Check className="size-4 text-success" aria-label="Passwords match" />}
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-start gap-2.5">
          <input
            id="agreedToTerms"
            type="checkbox"
            className="mt-0.5 size-[18px] shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("agreedToTerms")}
          />
          <Label
            htmlFor="agreedToTerms"
            className="cursor-pointer text-[13px] font-normal leading-relaxed text-muted-foreground"
          >
            I agree to the{" "}
            <Link
              href="/terms"
              onClick={(e) => e.stopPropagation()}
              className="text-foreground underline-offset-2 hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              onClick={(e) => e.stopPropagation()}
              className="text-foreground underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </Label>
        </div>
        {errors.agreedToTerms && <p className="text-xs text-destructive">{errors.agreedToTerms.message}</p>}

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <Button type="submit" disabled={isSubmitting || !agreedToTerms} className="w-full">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
