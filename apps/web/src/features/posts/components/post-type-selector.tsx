"use client";

import { Code2, Github, Image as ImageIcon, Link as LinkIcon, Type, Video } from "lucide-react";
import { cn } from "@skilltego/utils";
import type { CreatePostInput } from "../schema";

export const TYPE_CARDS = [
  { key: "photo", label: "Photo", icon: ImageIcon, formType: "image" },
  { key: "video", label: "Video", icon: Video, formType: "image" },
  { key: "text", label: "Text", icon: Type, formType: "image", hidesMedia: true },
  { key: "code", label: "Code", icon: Code2, formType: "code" },
  { key: "github", label: "GitHub", icon: Github, formType: "github_link" },
  { key: "project", label: "Project", icon: LinkIcon, formType: "project_link" },
] as const satisfies readonly {
  key: string;
  label: string;
  icon: typeof ImageIcon;
  formType: CreatePostInput["type"];
  hidesMedia?: boolean;
}[];

export type TypeCardKey = (typeof TYPE_CARDS)[number]["key"];

interface PostTypeSelectorProps {
  activeCard: TypeCardKey;
  onSelect: (card: (typeof TYPE_CARDS)[number]) => void;
}

export function PostTypeSelector({ activeCard, onSelect }: PostTypeSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {TYPE_CARDS.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onSelect(card)}
          className={cn(
            "flex shrink-0 flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-xs font-medium transition-colors",
            activeCard === card.key
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:bg-accent",
          )}
        >
          <card.icon className="size-5" />
          {card.label}
        </button>
      ))}
    </div>
  );
}
