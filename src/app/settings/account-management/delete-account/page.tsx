"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { 
  AlertTriangle, 
  Trash2, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";

export default function DeleteAccountPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const isValid = text.trim().toLowerCase() === "delete";

  const handleDelete = async () => {
    if (!isValid) {
      setError("Please type DELETE exactly as shown to confirm.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const supabase = getSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Session expired. Please login again.");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // ✅ FIXED: Use Next.js API (NOT localhost:5000)
      const res = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to delete account. Please try again.");
      }

      // ✅ Success UI
      setMessage("Your account and all associated data have been deleted.");

      setTimeout(async () => {
        await supabase.auth.signOut();
        router.replace("/login");
      }, 2500);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 relative">
      
      {/* 🔹 HEADER */}
      <div className="sticky top-4 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-[#FAFAFA]/90 rounded-xl pt-3 pb-5 border border-gray-200/60 shadow-[0_4px_20px_-15px_rgba(0,0,0,0.15)] -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span onClick={() => router.push("/settings")} className="cursor-pointer hover:text-black transition-colors">
            Settings
          </span>
          <ChevronRight size={14} className="mx-2" />
          <span onClick={() => router.push("/settings/account-management")} className="cursor-pointer hover:text-black transition-colors">
            Account Management
          </span>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-red-600 font-medium">Delete Account</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Delete Account
        </h1>
      </div>

      {/* 🔹 CONTENT */}
      <div className="mt-8 max-w-xl">
        
        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-900">This action is permanent</h2>
              <p className="text-sm text-red-800/80 mt-1 mb-4 leading-relaxed">
                Once you delete your account, there is absolutely no going back.
              </p>

              <ul className="space-y-2 text-sm text-red-800/90 font-medium">
                <li className="flex items-center gap-2">
                  <XCircle size={16} className="text-red-500" /> All data will be deleted
                </li>
                <li className="flex items-center gap-2">
                  <XCircle size={16} className="text-red-500" /> Files will be removed
                </li>
                <li className="flex items-center gap-2">
                  <XCircle size={16} className="text-red-500" /> OAuth connections removed
                </li>
              </ul>
            </div>
          </div>
        </div>

        {!message ? (
          <div className="space-y-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

            {/* Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Type <span className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded border border-gray-200 font-mono">DELETE</span> to confirm
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Type DELETE to confirm"
                  className={`w-full p-3.5 text-sm rounded-xl outline-none transition-all border font-semibold text-gray-900 ${
                    text.length > 0 && isValid
                      ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-100"
                      : "border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-white"
                  }`}
                />

                {isValid && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {/* Button */}
            <button
              onClick={handleDelete}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
                loading
                  ? "bg-red-400 text-white cursor-not-allowed"
                  : isValid
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-100 text-gray-400 border hover:bg-red-50 hover:text-red-500"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Delete Account
                </>
              )}
            </button>

          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
            <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-emerald-900 mb-2">Account Deleted</h2>
            <p className="text-sm text-emerald-700">
              {message} Redirecting...
            </p>
          </div>
        )}

      </div>
    </div>
  );
}