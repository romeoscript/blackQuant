import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { User } from "@prisma/client";

/**
 * Merge Tailwind class names, resolving conflicts so the last-wins rule
 * behaves as expected (e.g. `cn("p-2", condition && "p-4")`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatName(fullName: User["name"] | undefined): string {
  if (!fullName) return "Anonymous User";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export function containsProfanity(text: string): boolean {
  return matcher.hasMatch(text);
}
