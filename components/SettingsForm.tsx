"use client";

import { useActionState } from "react";
import { updateCommunityName } from "@/lib/actions";

export function SettingsForm({ communityName }: { communityName: string }) {
  const [state, formAction, pending] = useActionState(updateCommunityName, null);
  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Community name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={communityName}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
        />
        <p className="mt-1 text-xs text-gray-400">
          This name is shown to your members in the community app.
        </p>
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {state?.ok && <span className="text-sm text-green-600">Saved ✓</span>}
      </div>
    </form>
  );
}
