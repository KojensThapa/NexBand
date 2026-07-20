"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { deleteCurrentAccount, updateCurrentUser } from "@/services/user";
import { cn } from "@/lib/utils";

const MAX_PROFILE_IMAGE_MB = 2;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export function ProfileSection() {
  const { user, setUser, signOut } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [image, setImage] = useState(user?.image);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setImage(user?.image);
  }, [user]);

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WEBP, etc.).");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_PROFILE_IMAGE_MB} MB.`);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImage(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const updated = await updateCurrentUser({ name, image: image ?? null });
      setUser(updated);
      setSuccess("Profile updated successfully.");

      // Give the user a moment to see the success message, then return
      // to their main dashboard.
      setTimeout(() => {
        router.replace("/dashboard");
      }, 1_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    signOut();
    router.push("/auth/signin");
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (!user) return;

    setError(null);
    setIsDeleting(true);

    try {
      await deleteCurrentAccount();
      signOut();
      router.push("/auth/signin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4">
          <ProfileAvatar name={name || "User"} image={image} size="md" theme="indigo" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Profile</h2>
            <p className="text-sm text-slate-500">Manage your account details</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-start">
            <ProfileAvatar name={name || "User"} image={image} size="lg" theme="indigo" />
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <p className="text-sm font-medium text-slate-700">Profile photo</p>
              <p className="text-xs text-slate-500">
                Upload a photo or use the default avatar with your initials.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Upload image
                </button>
                {image ? (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {user?.email ?? "—"}
            </p>
            <p className="mt-1.5 text-xs text-slate-400">Email cannot be changed.</p>
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className={cn(
              "flex w-full items-center justify-center rounded-xl bg-[#553285] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#432668] disabled:opacity-60"
            )}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <div className="mt-8 space-y-3 border-t border-slate-100 pt-8">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Logout
          </button>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
            >
              Delete account
            </button>
          ) : (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-medium text-rose-800">
                Delete your account permanently?
              </p>
              <p className="mt-1 text-xs text-rose-600">
                This action cannot be undone. All your data will be removed.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
                >
                  {isDeleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-rose-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
