"use client";

import { useActionState, useEffect, useState } from "react";
import { SquarePen, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Card, Toggle } from "@/components/dashboard/widgets";
import {
  CURRENCIES,
  NOTIFICATION_PREFERENCES,
  type NotificationPreferenceKey,
  type Profile,
} from "@/lib/profile";
import {
  setNotificationPreference,
  updateProfile,
  type ProfileState,
} from "@/app/profile-actions";

const IDLE: ProfileState = { ok: false, message: "" };

export function PersonalInfo({ profile }: { profile: Profile }) {
  const [editing, setEditing] = useState(false);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-bq-heading">Personal Information</h2>
        <button
          onClick={() => setEditing((e) => !e)}
          className="flex items-center gap-1.5 rounded-lg border border-bq-border px-3 py-1.5 text-[12px] font-medium text-bq-text transition-colors hover:bg-bq-overlay/5"
        >
          {editing ? (
            <>
              <X className="size-3.5" /> Cancel
            </>
          ) : (
            <>
              <SquarePen className="size-3.5" /> Edit
            </>
          )}
        </button>
      </div>

      {editing ? (
        <EditForm profile={profile} onSaved={() => setEditing(false)} />
      ) : (
        <ReadOnlyFields profile={profile} />
      )}

      <p className="mt-6 border-t border-bq-border-soft pt-4 text-[13px] font-semibold text-bq-heading">
        Notification Preferences
      </p>
      <div className="mt-3 space-y-3">
        {NOTIFICATION_PREFERENCES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-[13px] text-bq-muted">{label}</span>
            <PreferenceToggle
              preferenceKey={key}
              label={label}
              defaultOn={profile.preferences[key]}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReadOnlyFields({ profile }: { profile: Profile }) {
  const fields = [
    { label: "Full Name", value: profile.name },
    { label: "Username", value: profile.username && `@${profile.username}` },
    { label: "Email", value: profile.email },
    { label: "Phone", value: profile.phone },
    { label: "Country", value: profile.country },
    { label: "Currency", value: profile.currency },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
      {fields.map((f) => (
        <div key={f.label}>
          <p className="text-[11px] text-bq-dim">{f.label}</p>
          <p className="mt-0.5 text-[13px] font-medium text-bq-heading">
            {f.value || <span className="text-bq-dim">Not set</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

function EditForm({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, IDLE);

  useEffect(() => {
    if (!state.ok) return;
    toast.success(state.message);
    onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction} className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
      <Field name="name" label="Full Name" defaultValue={profile.name ?? ""} required />
      <Field name="username" label="Username" defaultValue={profile.username ?? ""} />
      <div>
        <label className="text-[11px] text-bq-dim">Email</label>
        <p className="mt-1.5 text-[13px] font-medium text-bq-dim">{profile.email}</p>
        <p className="mt-0.5 text-[11px] text-bq-dim">
          Contact support to change your email.
        </p>
      </div>
      <Field name="phone" label="Phone" defaultValue={profile.phone ?? ""} />
      <Field name="country" label="Country" defaultValue={profile.country ?? ""} />
      <div>
        <label htmlFor="currency" className="text-[11px] text-bq-dim">
          Currency
        </label>
        <select
          id="currency"
          name="currency"
          defaultValue={profile.currency}
          className="mt-1 w-full rounded-lg border border-bq-border bg-bq-bg px-3 py-2 text-[13px] text-bq-heading focus:border-primary focus:outline-none"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-bq-contrast px-4 py-2 text-[13px] font-semibold text-bq-on-fill transition-transform hover:scale-[1.02] active:translate-y-px disabled:opacity-60"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          {pending ? "Saving…" : "Save changes"}
        </button>
        {!state.ok && state.message && (
          <p role="alert" className="text-[12px] text-bq-loss-text">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-[11px] text-bq-dim">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-lg border border-bq-border bg-bq-bg px-3 py-2 text-[13px] text-bq-heading focus:border-primary focus:outline-none"
      />
    </div>
  );
}

function PreferenceToggle({
  preferenceKey,
  label,
  defaultOn,
}: {
  preferenceKey: NotificationPreferenceKey;
  label: string;
  defaultOn: boolean;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <Toggle
      defaultOn={defaultOn}
      disabled={saving}
      label={label}
      onToggle={async (on) => {
        setSaving(true);
        const result = await setNotificationPreference(preferenceKey, on);
        setSaving(false);
        if (!result.ok) toast.error(result.message);
      }}
    />
  );
}
