import { z } from "zod";

/** Documents the user can verify with, and how many sides each needs. */
export const DOCUMENT_TYPES = [
  { id: "passport", name: "Passport", sub: "Photo page only", sides: 1 },
  { id: "licence", name: "Driver's licence", sub: "Front and back required", sides: 2 },
  { id: "id", name: "National ID card", sub: "Front and back required", sides: 2 },
] as const;

export type DocumentTypeId = (typeof DOCUMENT_TYPES)[number]["id"];

export const documentTypeSchema = z.enum(["id", "passport", "licence"]);

export function sidesFor(documentType: string): number {
  return DOCUMENT_TYPES.find((d) => d.id === documentType)?.sides ?? 1;
}

/** Kept small: these are photographed documents, not scans of a whole file. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const UPLOAD_ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");

export const REQUIREMENTS = [
  "Document must be valid and not expired",
  "All four corners must be visible",
  "Text must be clearly legible",
  "No glare, shadows, or obstructions",
];

export function isAcceptedImage(type: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function humanBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
