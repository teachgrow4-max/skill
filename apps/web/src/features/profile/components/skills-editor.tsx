"use client";

import * as React from "react";
import { Controller, useFieldArray, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { skillCategories } from "@skilltego/config";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@skilltego/ui";
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
        <div
          key={field.id}
          className="glass grid grid-cols-[1fr_1fr_1fr_auto] items-start gap-2 rounded-xl p-3"
        >
          <div className="grid gap-1">
            <Input placeholder="Skill name" {...register(`skills.${index}.skillName` as const)} />
            {errors.skills?.[index]?.skillName && (
              <p className="text-xs text-destructive">{errors.skills[index]?.skillName?.message}</p>
            )}
          </div>

          <Controller
            control={control}
            name={`skills.${index}.category` as const}
            render={({ field: categoryField }) => (
              <Select value={categoryField.value} onValueChange={categoryField.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {skillCategories.map((category) => (
                    <SelectGroup key={category.slug}>
                      <SelectLabel>{category.name}</SelectLabel>
                      {category.subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          <Controller
            control={control}
            name={`skills.${index}.proficiency` as const}
            render={({ field: proficiencyField }) => (
              <Select value={proficiencyField.value} onValueChange={proficiencyField.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            aria-label="Remove skill"
          >
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
