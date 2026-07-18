"use client";

import * as React from "react";
import { useFieldArray, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { skillCategories } from "@skilltego/config";
import { Button, Input } from "@skilltego/ui";
import { X } from "lucide-react";
import { PROFICIENCY_OPTIONS, type ProfileFormValues } from "../schema";

interface SkillsEditorProps {
  control: Control<ProfileFormValues>;
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
}

export function SkillsEditor({ control, register, errors }: SkillsEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "skills" });

  return (
    <div className="grid gap-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">Add at least one skill so people can discover you.</p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-start gap-2 rounded-lg border border-border p-3">
          <div className="grid gap-1">
            <Input placeholder="Skill name" {...register(`skills.${index}.skillName` as const)} />
            {errors.skills?.[index]?.skillName && (
              <p className="text-xs text-destructive">{errors.skills[index]?.skillName?.message}</p>
            )}
          </div>

          <select
            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            {...register(`skills.${index}.category` as const)}
          >
            <option value="">Category</option>
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

          <select
            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            {...register(`skills.${index}.proficiency` as const)}
          >
            {PROFICIENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Remove skill">
            <X className="size-4" />
          </Button>
        </div>
      ))}

      {errors.skills?.root && <p className="text-xs text-destructive">{errors.skills.root.message}</p>}
      {errors.skills?.message && <p className="text-xs text-destructive">{errors.skills.message}</p>}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={fields.length >= 20}
        onClick={() =>
          append({ skillName: "", category: "", proficiency: "beginner", isPrimary: fields.length === 0 })
        }
      >
        Add skill
      </Button>
    </div>
  );
}
