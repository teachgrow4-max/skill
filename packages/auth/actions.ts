import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@skilltego/types";

type Client = SupabaseClient<Database>;
export type OAuthProvider = "google" | "github";

export async function signUpWithEmail(
  client: Client,
  input: {
    email: string;
    password: string;
    fullName: string;
    emailRedirectTo: string;
    referralCode?: string;
  },
) {
  return client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: input.emailRedirectTo,
      data: { full_name: input.fullName, referral_code: input.referralCode || undefined },
    },
  });
}

export async function signInWithEmail(client: Client, input: { email: string; password: string }) {
  return client.auth.signInWithPassword({ email: input.email, password: input.password });
}

export async function signInWithOAuth(client: Client, provider: OAuthProvider, redirectTo: string) {
  return client.auth.signInWithOAuth({
    provider,
    options: { redirectTo, queryParams: { prompt: "select_account" } },
  });
}

export async function sendOtp(client: Client, email: string, emailRedirectTo?: string) {
  return client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo, shouldCreateUser: true },
  });
}

export async function verifyOtp(client: Client, email: string, token: string) {
  return client.auth.verifyOtp({ email, token, type: "email" });
}

export async function sendPasswordResetEmail(client: Client, email: string, redirectTo: string) {
  return client.auth.resetPasswordForEmail(email, { redirectTo });
}

export async function updatePassword(client: Client, password: string) {
  return client.auth.updateUser({ password });
}

export async function resendVerificationEmail(client: Client, email: string, emailRedirectTo: string) {
  return client.auth.resend({ type: "signup", email, options: { emailRedirectTo } });
}

export async function signOut(client: Client) {
  return client.auth.signOut();
}
