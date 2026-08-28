"use client";

import { useEffect, useState, useTransition, useActionState } from "react";
import {
  createMember,
  updateMember,
  removeMember,
  setMemberRoles,
} from "@/lib/actions";
import { badgeClass } from "@/lib/colors";
import type { MemberWithRoles, Role } from "@/lib/types";
import { Modal } from "./Modal";

type ModalState =
  | { type: "add" }
  | { type: "edit"; member: MemberWithRoles }
  | { type: "roles"; member: MemberWithRoles }
  | { type: "remove"; member: MemberWithRoles }
  | null;

export function MembersTable({
  members,
  roles,
}: {
  members: MemberWithRoles[];
  roles: Role[];
}) {
  const [modal, setModal] = useState<ModalState>(null);
  const close = () => setModal(null);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Members</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {members.length} active {members.length === 1 ? "member" : "members"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ type: "add" })}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add member
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">Roles</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                  No members yet. Add your first member to get started.
                </td>
              </tr>
            )}
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium">
                  {member.firstName} {member.lastName}
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {member.email ?? "—"}
                  {member.phone && (
                    <span className="block text-xs">{member.phone}</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => setModal({ type: "roles", member })}
                    className="flex flex-wrap items-center gap-1"
                    title="Edit roles"
                  >
                    {member.roles.length === 0 ? (
                      <span className="text-xs text-gray-400 underline decoration-dotted">
                        Assign roles
                      </span>
                    ) : (
                      member.roles.map((role) => (
                        <span
                          key={role.id}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(role.color)}`}
                        >
                          {role.name}
                        </span>
                      ))
                    )}
                  </button>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setModal({ type: "edit", member })}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ type: "remove", member })}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal?.type === "add" || modal?.type === "edit") && (
        <MemberFormModal
          member={modal.type === "edit" ? modal.member : null}
          roles={roles}
          onClose={close}
        />
      )}
      {modal?.type === "roles" && (
        <RoleAssignModal member={modal.member} roles={roles} onClose={close} />
      )}
      {modal?.type === "remove" && (
        <RemoveMemberModal member={modal.member} onClose={close} />
      )}
    </>
  );
}

function MemberFormModal({
  member,
  roles,
  onClose,
}: {
  member: MemberWithRoles | null;
  roles: Role[];
  onClose: () => void;
}) {
  const action = member ? updateMember.bind(null, member.id) : createMember;
  const [state, formAction, pending] = useActionState(action, null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(
    () => new Set(member?.roles.map((role) => role.id))
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  return (
    <Modal title={member ? "Edit member" : "Add member"} onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              defaultValue={member?.firstName}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              defaultValue={member?.lastName}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
            />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={member?.email ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            Phone <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={member?.phone ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium">
            Roles <span className="font-normal text-gray-400">(optional)</span>
          </span>
          {roles.length === 0 ? (
            <p className="text-xs text-gray-400">
              No roles yet — create one on the Roles page to assign it here.
            </p>
          ) : (
            <div className="max-h-36 space-y-0.5 overflow-y-auto rounded-lg border border-gray-200 p-1">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    name="roleIds"
                    value={role.id}
                    checked={selectedRoles.has(role.id)}
                    onChange={() => toggleRole(role.id)}
                    className="h-4 w-4 accent-gray-900"
                  />
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(role.color)}`}
                  >
                    {role.name}
                  </span>
                </label>
              ))}
            </div>
          )}
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
            {pending ? "Saving…" : member ? "Save changes" : "Add member"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RoleAssignModal({
  member,
  roles,
  onClose,
}: {
  member: MemberWithRoles;
  roles: Role[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(member.roles.map((role) => role.id))
  );
  const [pending, startTransition] = useTransition();

  const toggle = (roleId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const save = () => {
    startTransition(async () => {
      await setMemberRoles(member.id, [...selected]);
      onClose();
    });
  };

  return (
    <Modal
      title={`Roles for ${member.firstName} ${member.lastName}`}
      onClose={onClose}
    >
      {roles.length === 0 ? (
        <p className="text-sm text-gray-500">
          No roles exist yet. Create roles on the Roles page first.
        </p>
      ) : (
        <div className="space-y-1">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.has(role.id)}
                onChange={() => toggle(role.id)}
                className="h-4 w-4 accent-gray-900"
              />
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(role.color)}`}
              >
                {role.name}
              </span>
            </label>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
        {roles.length > 0 && (
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save roles"}
          </button>
        )}
      </div>
    </Modal>
  );
}

function RemoveMemberModal({
  member,
  onClose,
}: {
  member: MemberWithRoles;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const confirm = () => {
    startTransition(async () => {
      await removeMember(member.id);
      onClose();
    });
  };
  return (
    <Modal title="Remove member" onClose={onClose}>
      <p className="text-sm text-gray-600">
        Remove{" "}
        <span className="font-medium text-gray-900">
          {member.firstName} {member.lastName}
        </span>{" "}
        from the community? They will no longer appear in the member list.
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
          {pending ? "Removing…" : "Remove"}
        </button>
      </div>
    </Modal>
  );
}
