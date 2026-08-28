"use client";

import { useEffect, useState, useTransition, useActionState } from "react";
import { createRole, updateRole, deleteRole } from "@/lib/actions";
import { badgeClass, dotClass } from "@/lib/colors";
import type { Role } from "@/lib/types";
import { ROLE_COLORS } from "@/lib/types";
import { Modal } from "./Modal";

type ModalState =
  | { type: "add" }
  | { type: "edit"; role: Role }
  | { type: "delete"; role: Role }
  | null;

export function RolesManager({ roles }: { roles: Role[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  const close = () => setModal(null);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Roles</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Roles let members find trainers and like-minded people. Assign them
            from the Members page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ type: "add" })}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add role
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Members</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roles.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-10 text-center text-gray-500">
                  No roles yet. Create roles like “Trainer” or “Yoga” to tag
                  your members.
                </td>
              </tr>
            )}
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(role.color)}`}
                  >
                    {role.name}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">{role.memberCount}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setModal({ type: "edit", role })}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ type: "delete", role })}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal?.type === "add" || modal?.type === "edit") && (
        <RoleFormModal
          role={modal.type === "edit" ? modal.role : null}
          onClose={close}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteRoleModal role={modal.role} onClose={close} />
      )}
    </>
  );
}

function RoleFormModal({
  role,
  onClose,
}: {
  role: Role | null;
  onClose: () => void;
}) {
  const action = role ? updateRole.bind(null, role.id) : createRole;
  const [state, formAction, pending] = useActionState(action, null);
  const [color, setColor] = useState<string>(role?.color ?? "gray");

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <Modal title={role ? "Edit role" : "Add role"} onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Role name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={role?.name}
            placeholder="e.g. Trainer"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium">Color</span>
          <input type="hidden" name="color" value={color} />
          <div className="flex flex-wrap gap-2">
            {ROLE_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                aria-label={option}
                className={`h-7 w-7 rounded-full ${dotClass(option)} ${
                  color === option
                    ? "ring-2 ring-gray-900 ring-offset-2"
                    : "hover:scale-110"
                }`}
              />
            ))}
          </div>
        </div>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {pending ? "Saving…" : role ? "Save changes" : "Add role"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteRoleModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const confirm = () => {
    startTransition(async () => {
      await deleteRole(role.id);
      onClose();
    });
  };
  return (
    <Modal title="Delete role" onClose={onClose}>
      <p className="text-sm text-gray-600">
        Delete the role{" "}
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(role.color)}`}
        >
          {role.name}
        </span>
        ?{" "}
        {role.memberCount > 0 && (
          <>
            It will be unassigned from{" "}
            <span className="font-medium text-gray-900">
              {role.memberCount} {role.memberCount === 1 ? "member" : "members"}
            </span>
            .
          </>
        )}
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={pending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Delete role"}
        </button>
      </div>
    </Modal>
  );
}
