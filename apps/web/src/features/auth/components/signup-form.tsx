"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, signUpWithEmail, type SignUpInput } from "@skilltego/auth";
import { Button, Input, Label } from "@skilltego/ui";
import { siteConfig } from "@skilltego/config";
import { createClient } from "@/lib/supabase/browser";
import { trackEvent } from "@/providers/posthog-provider";
import { OAuthButtons } from "./oauth-buttons";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") ?? undefined;
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  const agreedToTerms = watch("agreedToTerms");

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
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
          {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <input
            id="agreedToTerms"
            type="checkbox"
            className="mt-0.5 size-4 rounded border-input"
            {...register("agreedToTerms")}
          />
          <Label htmlFor="agreedToTerms" className="font-normal text-muted-foreground">
            I have read and agree to the {siteConfig.name}{" "}
            <Link
              href="/terms"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Privacy Policy
            </Link>
            . I understand that {siteConfig.legalEntity} may collect, process, store, and access my data as
            described to provide, maintain, secure, and improve the {siteConfig.name} platform.
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
