"use client";

import { useActionState, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/dashboard/widgets";
import {
  deleteAccount,
  exportAccountData,
  type ProfileState,
} from "@/app/profile-actions";

const IDLE: ProfileState = { ok: false, message: "" };

export function DangerZone() {
  return (
    <Card>
      <h2 className="font-semibold text-bq-heading">Danger Zone</h2>
      <p className="text-[12px] text-bq-dim">
        These actions are irreversible. Proceed with caution.
      </p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <ExportButton />
        <DeleteAccount />
      </div>
    </Card>
  );
}

function ExportButton() {
  const [working, setWorking] = useState(false);

  async function download() {
    setWorking(true);
    try {
      const json = await exportAccountData();
      if (!json) {
        toast.error("We couldn't export your data. Try signing in again.");
        return;
      }
      const url = URL.createObjectURL(
        new Blob([json], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "blackquant-account.json";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setWorking(false);
    }
  }

  return (
    <button
      onClick={download}
      disabled={working}
      className="flex items-center gap-2 rounded-lg border border-bq-border px-4 py-2 text-[13px] font-medium text-bq-text transition-colors hover:bg-bq-overlay/5 disabled:opacity-60"
    >
      {working ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Export Data
    </button>
  );
}

function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccount, IDLE);

  useEffect(() => {
    if (!state.ok) return;
    // The row is gone; the cookie still says otherwise until it is cleared.
    signOut({ callbackUrl: "/" });
  }, [state.ok]);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-2 rounded-lg border border-bq-loss/30 bg-bq-loss/[0.06] px-4 py-2 text-[13px] font-semibold text-bq-loss-text transition-colors hover:bg-bq-loss/10"
      >
        <Trash2 className="size-4" /> Delete Account
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full rounded-lg border border-bq-loss/30 bg-bq-loss/[0.06] p-4"
    >
      <p className="text-[13px] font-semibold text-bq-loss-text">
        This permanently deletes your account and all its data.
      </p>
      <label htmlFor="delete-password" className="mt-3 block text-[12px] text-bq-muted">
        Enter your password to confirm
      </label>
      <input
        id="delete-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="mt-1.5 w-full rounded-lg border border-bq-border bg-bq-bg px-3 py-2 text-[13px] text-bq-heading focus:border-bq-loss focus:outline-none"
      />
      {!state.ok && state.message && (
        <p role="alert" className="mt-2 text-[12px] text-bq-loss-text">
          {state.message}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-bq-loss px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          {pending ? "Deleting…" : "Delete permanently"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-bq-border px-4 py-2 text-[13px] font-medium text-bq-text transition-colors hover:bg-bq-overlay/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
