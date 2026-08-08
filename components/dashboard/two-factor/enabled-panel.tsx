"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, RefreshCw, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Card, StatPill } from "@/components/dashboard/widgets";
import { BackupCodes } from "./setup";
import {
  disableTwoFactor,
  regenerateRecoveryCodes,
  type TwoFactorState,
  type TwoFactorStatus,
} from "@/app/two-factor-actions";

const IDLE: TwoFactorState = { ok: false, message: "" };

export function EnabledPanel({ status }: { status: TwoFactorStatus }) {
  const [codes, setCodes] = useState<string[]>([]);

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-bq-heading">Authenticator app</h2>
            <p className="text-[12px] text-bq-dim">
              {status.enabledAt
                ? `Enabled ${new Date(status.enabledAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
                : "Enabled"}
            </p>
          </div>
          <StatPill tone="green">Active</StatPill>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-bq-border-soft pt-4">
          <div>
            <p className="text-[13px] font-medium text-bq-heading">
              Backup codes
            </p>
            <p className="text-[11px] text-bq-dim">
              {status.recoveryCodesRemaining} unused
              {status.recoveryCodesRemaining <= 2 && ", generate a new set soon"}
            </p>
          </div>
          <RegenerateButton onGenerated={setCodes} />
        </div>
      </Card>

      {codes.length > 0 && <BackupCodes codes={codes} />}

      <DisableCard hasPassword={status.hasPassword} />
    </>
  );
}

function RegenerateButton({
  onGenerated,
}: {
  onGenerated: (codes: string[]) => void;
}) {
  const [working, setWorking] = useState(false);

  return (
    <button
      onClick={async () => {
        setWorking(true);
        const result = await regenerateRecoveryCodes();
        setWorking(false);
        if (result.ok && result.recoveryCodes) {
          onGenerated(result.recoveryCodes);
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      }}
      disabled={working}
      className="flex items-center gap-2 rounded-lg border border-bq-border px-4 py-2 text-[13px] font-medium text-bq-text transition-colors hover:bg-bq-overlay/5 disabled:opacity-60"
    >
      {working ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      Regenerate
    </button>
  );
}

function DisableCard({ hasPassword }: { hasPassword: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(disableTwoFactor, IDLE);

  useEffect(() => {
    if (state.ok) toast.success(state.message);
  }, [state.ok, state.message]);

  return (
    <Card>
      <h2 className="font-semibold text-bq-heading">Turn off Auth Guard</h2>
      <p className="text-[12px] text-bq-dim">
        Your account will be protected by its password alone. Backup codes are
        destroyed.
      </p>

      {!hasPassword ? (
        <p className="mt-4 text-[13px] text-bq-muted">
          This account signs in through a provider, so there is no password to
          confirm with.
        </p>
      ) : !confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="mt-4 flex items-center gap-2 rounded-lg border border-bq-loss/30 bg-bq-loss/[0.06] px-4 py-2 text-[13px] font-semibold text-bq-loss-text transition-colors hover:bg-bq-loss/10"
        >
          <ShieldOff className="size-4" /> Disable
        </button>
      ) : (
        <form action={formAction} className="mt-4">
          <label htmlFor="disable-password" className="text-[12px] text-bq-muted">
            Enter your password to confirm
          </label>
          <input
            id="disable-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1.5 w-full max-w-sm rounded-lg border border-bq-border bg-bq-bg px-3 py-2 text-[13px] text-bq-heading focus:border-bq-loss focus:outline-none"
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
              {pending ? "Disabling…" : "Disable Auth Guard"}
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
      )}
    </Card>
  );
}
