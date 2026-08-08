"use client";

import { useRef, useTransition } from "react";
import { Calendar, Camera, Loader2, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/dashboard/widgets";
import { Avatar } from "@/components/dashboard/avatar";
import { AVATAR_QUERY_KEY } from "@/hooks/use-avatar";
import { userIdentity } from "@/lib/user-display";
import { cn, humanBytes } from "@/lib/utils";
import {
  AVATAR_ACCEPT_ATTRIBUTE,
  AVATAR_MAX_EDGE,
  MAX_AVATAR_BYTES,
  isAcceptedAvatar,
} from "@/lib/avatar";
import type { Profile } from "@/lib/profile";
import {
  removeAvatar,
  updateAvatar,
  type ProfileState,
} from "@/app/profile-actions";

const monthYear = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
});

export function ProfileHeader({ profile }: { profile: Profile }) {
  const { displayName, initials } = userIdentity(profile);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  /** Both actions end the same way: tell the user, and refresh the chrome. */
  const run = (action: () => Promise<ProfileState>) =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: AVATAR_QUERY_KEY });
    });

  const onPicked = async (file: File | undefined) => {
    if (!file) return;
    if (!isAcceptedAvatar(file.type)) {
      toast.error("Choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(`That image is over ${humanBytes(MAX_AVATAR_BYTES)}.`);
      return;
    }

    const body = new FormData();
    body.set("avatar", await downscaled(file));
    run(() => updateAvatar(body));
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            aria-label="Change profile picture"
            className="group relative block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Avatar
              src={profile.avatarUrl}
              initials={initials}
              className="size-16 rounded-2xl text-xl"
            />
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 transition-opacity",
                pending
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
              )}
            >
              {pending ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                <Camera className="size-5 text-white" />
              )}
            </span>
          </button>
          <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-bq-surface bg-primary" />
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-bold text-bq-heading">{displayName}</h2>
          <p className="text-[13px] text-bq-muted">{profile.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-bq-dim">
            {profile.country && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {profile.country}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" /> Member since{" "}
              {monthYear.format(new Date(profile.memberSince))}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg border border-bq-border px-3 py-1.5 text-[12px] font-medium text-bq-text transition-colors hover:bg-bq-overlay/5 disabled:opacity-60"
          >
            <Camera className="size-3.5" />
            {profile.avatarUrl ? "Change photo" : "Add photo"}
          </button>
          {profile.avatarUploaded && (
            <button
              type="button"
              onClick={() => run(removeAvatar)}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg border border-bq-border px-3 py-1.5 text-[12px] font-medium text-bq-muted transition-colors hover:text-bq-loss-text disabled:opacity-60"
            >
              <Trash2 className="size-3.5" /> Remove
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={(e) => {
            void onPicked(e.target.files?.[0]);
            // Cleared so picking the same file twice still fires a change.
            e.target.value = "";
          }}
        />
      </div>
    </Card>
  );
}

/**
 * Shrinks the picked image to avatar size before it leaves the browser, so a
 * 4 MB phone photo is not what every page then downloads. Re-encoded to WebP,
 * which is the smallest of the three types we accept.
 *
 * Any failure returns the original file: the server accepts it either way, and
 * a picture that uploads slowly beats one that does not upload at all.
 */
async function downscaled(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      AVATAR_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.9),
    );
    return blob
      ? new File([blob], "avatar.webp", { type: "image/webp" })
      : file;
  } catch {
    return file;
  }
}
