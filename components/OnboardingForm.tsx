"use client";

import { useActionState } from "react";
import { createCommunity } from "@/lib/actions";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(createCommunity, null);
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
          type="text"
          placeholder="e.g. Downtown Fitness Club"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create community"}
      </button>
    </form>
  );
}
