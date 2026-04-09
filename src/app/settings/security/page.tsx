"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Loader2, Shield, LogOut } from "lucide-react";

export default function SecurityPage() {
  const supabase = getSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setEmail(session.user.email ?? null);

        const identities = session.user.identities;
        if (identities && identities.length > 0) {
          setProvider(identities[0].provider);
        }
      }

      setLoading(false);
    };

    load();
  }, [supabase]);

  const handleLogoutAll = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">
          Security
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account security and authentication.
        </p>
      </div>

      {/* Authentication */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Authentication
        </h2>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Signed in with {provider || "OAuth"}
              </p>
              <p className="text-xs text-gray-500">{email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="space-y-4 pt-6 border-t border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Account Actions
        </h2>

        <button
          onClick={handleLogoutAll}
          className="flex items-center gap-3 text-sm text-red-600 hover:text-red-700 transition"
        >
          <LogOut size={16} />
          Sign out from this device
        </button>
      </div>

      {/* Info */}
      <div className="pt-6 border-t border-gray-100 text-xs text-gray-400 leading-relaxed">
        You are signed in using a third-party provider. Password management is handled by your provider (Google, GitHub, etc).
      </div>

    </div>
  );
}