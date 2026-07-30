"use client";

import { motion } from "framer-motion";
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
    <div className="glass flex gap-1 overflow-x-auto rounded-full p-1 scrollbar-none">
      {TYPE_CARDS.map((card) => {
        const isActive = activeCard === card.key;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelect(card)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="composer-type-indicator"
                className="gradient-brand absolute inset-0 -z-10 rounded-full shadow-glow"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <card.icon className="size-5" />
            {card.label}
          </button>
        );
      })}
    </div>
  );
}
