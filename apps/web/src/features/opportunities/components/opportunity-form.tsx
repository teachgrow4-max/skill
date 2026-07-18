"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Button, Input, Textarea } from "@skilltego/ui";
import { skillCategories } from "@skilltego/config";
import { createOpportunityAction } from "../actions";
import { KIND_LABELS, opportunitySchema, type OpportunityInput } from "../schema";

interface OpportunityFormProps {
  allowedKinds: OpportunityInput["kind"][];
  onCreated?: () => void;
}

export function OpportunityForm({ allowedKinds, onCreated }: OpportunityFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<OpportunityInput>({
    defaultValues: {
      kind: allowedKinds[0],
      title: "",
      description: "",
      skillCategory: "",
      requiredSkills: [],
      location: "",
      isRemote: false,
      compensation: "",
      deadline: "",
      eventDate: "",
      status: "published",
    },
  });

  async function onSubmit(values: OpportunityInput) {
    setError(null);
    const parsed = opportunitySchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please fix the errors above.");
      return;
    }

    const result = await createOpportunityAction(parsed.data);
    if (!result.success) {
      setError(result.error ?? "Could not create posting.");
      return;
    }

    reset();
    onCreated?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass grid gap-3 rounded-xl p-4">
      <select className="h-10 rounded-md border border-input bg-background px-2 text-sm" {...register("kind")}>
        {allowedKinds.map((kind) => (
          <option key={kind} value={kind}>
            {KIND_LABELS[kind]}
          </option>
        ))}
      </select>

      <Input placeholder="Title" {...register("title")} />
      <Textarea placeholder="Description" rows={4} {...register("description")} />

      <div className="grid grid-cols-2 gap-2">
        <select className="h-10 rounded-md border border-input bg-background px-2 text-sm" {...register("skillCategory")}>
          <option value="">Skill category</option>
          {skillCategories.map((category) => (
            <optgroup key={category.slug} label={category.name}>
              {category.subcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <Input placeholder="Location" {...register("location")} />
      </div>

      <Controller
        name="requiredSkills"
        control={control}
        render={({ field }) => (
          <Input
            placeholder="Required skills, comma separated"
            defaultValue={field.value.join(", ")}
            onBlur={(e) =>
              field.onChange(
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 15),
              )
            }
          />
        )}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Compensation / prize (optional)" {...register("compensation")} />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" className="size-4" {...register("isRemote")} />
          Remote
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Application deadline</label>
          <Input type="date" {...register("deadline")} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Event date (if applicable)</label>
          <Input type="date" {...register("eventDate")} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Posting…" : "Post"}
      </Button>
    </form>
  );
}
