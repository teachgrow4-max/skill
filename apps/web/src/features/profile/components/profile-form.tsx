"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, Textarea } from "@skilltego/ui";
import type { Profile } from "@skilltego/types";
import { ACCOUNT_TYPE_OPTIONS, profileFormSchema, type ProfileFormValues } from "../schema";
import { saveProfileAction } from "../actions";
import { useUsernameAvailability } from "../hooks/use-username-availability";
import { SkillsEditor } from "./skills-editor";

interface ProfileFormProps {
  profile: Profile;
  mode: "onboarding" | "edit";
}

export function ProfileForm({ profile, mode }: ProfileFormProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: profile.username,
      fullName: profile.fullName,
      accountType: profile.accountType as ProfileFormValues["accountType"],
      bio: profile.bio ?? "",
      country: profile.country ?? "",
      state: profile.state ?? "",
      city: profile.city ?? "",
      website: profile.website ?? "",
      skills: profile.skills.map((skill) => ({
        skillName: skill.name,
        category: skill.category,
        proficiency: skill.proficiency,
        isPrimary: false,
      })),
    },
  });

  const usernameValue = watch("username");
  const usernameStatus = useUsernameAvailability(usernameValue, profile.username);

  async function onSubmit(values: ProfileFormValues) {
    setFormError(null);

    if (usernameStatus === "taken" || usernameStatus === "invalid") {
      setFormError("Please choose a different username before saving.");
      return;
    }

    const result = await saveProfileAction(values, { completeOnboarding: mode === "onboarding" });

    if (!result.success) {
      setFormError(result.error ?? "Something went wrong.");
      return;
    }

    router.push(`/profile/${result.username}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid gap-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="username">Username</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">skilltego.com/</span>
          <Input id="username" {...register("username")} className="flex-1" />
        </div>
        {usernameStatus === "checking" && <p className="text-xs text-muted-foreground">Checking availability…</p>}
        {usernameStatus === "available" && <p className="text-xs text-success">Username is available</p>}
        {usernameStatus === "taken" && <p className="text-xs text-destructive">Username is already taken</p>}
        {usernameStatus === "invalid" && (
          <p className="text-xs text-destructive">3-30 characters: lowercase letters, numbers, underscores</p>
        )}
        {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="accountType">I am a</Label>
        <select
          id="accountType"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          {...register("accountType")}
        >
          {ACCOUNT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={4} placeholder="Tell people what you're great at" {...register("bio")} />
        {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...register("country")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="state">State</Label>
          <Input id="state" {...register("state")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="website">Website</Label>
        <Input id="website" placeholder="https://" {...register("website")} />
        {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <Label>Skills</Label>
        <SkillsEditor control={control} register={register} errors={errors} />
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Saving…" : mode === "onboarding" ? "Complete profile" : "Save changes"}
      </Button>
    </form>
  );
}
