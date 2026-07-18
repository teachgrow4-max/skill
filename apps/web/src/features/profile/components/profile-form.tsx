"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, Textarea } from "@skilltego/ui";
import type { Profile } from "@skilltego/types";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import { AiSuggestButton } from "@/features/ai/components/ai-suggest-button";
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
  const [uploadingResume, setUploadingResume] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
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
      resumeUrl: profile.resumeUrl ?? "",
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
  const resumeUrl = watch("resumeUrl");

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isCloudinaryConfigured()) {
      setFormError("Resume upload isn't configured yet — add Cloudinary credentials to .env.local.");
      return;
    }

    setUploadingResume(true);
    try {
      const result = await uploadToCloudinary(file);
      setValue("resumeUrl", result.url, { shouldDirty: true });
    } catch (uploadError) {
      setFormError(uploadError instanceof Error ? uploadError.message : "Resume upload failed.");
    } finally {
      setUploadingResume(false);
      e.target.value = "";
    }
  }

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
        {usernameStatus === "checking" && (
          <p className="text-xs text-muted-foreground">Checking availability…</p>
        )}
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
        <AiSuggestButton
          label="Suggest a bio"
          system="You write short, warm, first-person social profile bios (max 3 sentences, under 300 characters) for a skill-showcase platform called Skilltego. No hashtags, no quotes, no markdown — just the bio text."
          getPrompt={() => {
            const skills = getValues("skills")
              .map((s) => s.skillName)
              .filter(Boolean);
            return `Write a bio for ${getValues("fullName") || "someone"}, a ${getValues("accountType")}${
              skills.length > 0 ? ` skilled in ${skills.join(", ")}` : ""
            }.`;
          }}
          onResult={(text) => setValue("bio", text.slice(0, 500), { shouldDirty: true })}
        />
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
        <Label htmlFor="resume">Resume</Label>
        {resumeUrl ? (
          <div className="flex items-center gap-2 text-sm">
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline"
            >
              View current resume
            </a>
            <label htmlFor="resume" className="cursor-pointer text-xs text-muted-foreground hover:underline">
              Replace
            </label>
          </div>
        ) : (
          <label
            htmlFor="resume"
            className="flex h-10 w-fit cursor-pointer items-center rounded-md border border-input px-3 text-sm text-muted-foreground hover:bg-accent"
          >
            {uploadingResume ? "Uploading…" : "Upload resume (PDF)"}
          </label>
        )}
        <input
          id="resume"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleResumeUpload}
        />
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
