"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { useTheme } from "@/theme/ThemeProvider"; // 🔥 Import Theme Provider
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
  
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state

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

      // 🔥 FIX: Guard clause to ensure supabase is not null
      if (!supabase) {
        throw new Error("Failed to initialize database connection. Please try again.");
      }

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
      <div className={`sticky top-4 z-10 backdrop-blur rounded-xl pt-3 pb-5 border shadow-[0_4px_20px_-15px_rgba(0,0,0,0.15)] -mx-4 sm:-mx-6 px-4 sm:px-6 transition-colors duration-300 ${
        isDarkMode ? "bg-[#0a0a0a]/80 border-gray-800" : "bg-[#FAFAFA]/90 border-gray-200/60 supports-[backdrop-filter]:bg-white/70"
      }`}>
        <div className={`flex items-center text-sm mb-4 transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          <span onClick={() => router.push("/settings")} className={`cursor-pointer transition-colors ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
            Settings
          </span>
          <ChevronRight size={14} className="mx-2" />
          <span onClick={() => router.push("/settings/account-management")} className={`cursor-pointer transition-colors ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
            Account Management
          </span>
          <ChevronRight size={14} className="mx-2" />
          <span className={`font-medium ${isDarkMode ? "text-red-500" : "text-red-600"}`}>Delete Account</span>
        </div>

        <h1 className={`text-3xl font-bold tracking-tight transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Delete Account
        </h1>
      </div>

      {/* 🔹 CONTENT */}
      <div className="mt-8 max-w-xl">
        
        {/* Warning */}
        <div className={`border rounded-2xl p-6 mb-8 transition-colors ${
          isDarkMode ? "bg-red-950/20 border-red-900/30" : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              isDarkMode ? "bg-red-900/50" : "bg-red-100"
            }`}>
              <AlertTriangle size={20} className={isDarkMode ? "text-red-400" : "text-red-600"} />
            </div>
            <div>
              <h2 className={`text-lg font-bold transition-colors ${isDarkMode ? "text-red-400" : "text-red-900"}`}>
                This action is permanent
              </h2>
              <p className={`text-sm mt-1 mb-4 leading-relaxed transition-colors ${isDarkMode ? "text-red-200/80" : "text-red-800/80"}`}>
                Once you delete your account, there is absolutely no going back.
              </p>

              <ul className={`space-y-2 text-sm font-medium transition-colors ${isDarkMode ? "text-red-200/90" : "text-red-800/90"}`}>
                <li className="flex items-center gap-2">
                  <XCircle size={16} className={isDarkMode ? "text-red-500" : "text-red-500"} /> All data will be deleted
                </li>
                <li className="flex items-center gap-2">
                  <XCircle size={16} className={isDarkMode ? "text-red-500" : "text-red-500"} /> Files will be removed
                </li>
                <li className="flex items-center gap-2">
                  <XCircle size={16} className={isDarkMode ? "text-red-500" : "text-red-500"} /> OAuth connections removed
                </li>
              </ul>
            </div>
          </div>
        </div>

        {!message ? (
          <div className={`space-y-6 border rounded-2xl p-6 shadow-sm transition-colors ${
            isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
          }`}>

            {/* Input */}
            <div>
              <label className={`block text-sm font-semibold mb-2 transition-colors ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                Type <span className={`px-1.5 py-0.5 rounded border font-mono transition-colors ${
                  isDarkMode ? "bg-gray-800 text-red-400 border-gray-700" : "bg-gray-100 text-red-600 border-gray-200"
                }`}>DELETE</span> to confirm
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
                  className={`w-full p-3.5 text-sm rounded-xl outline-none transition-all border font-semibold ${
                    text.length > 0 && isValid
                      ? (isDarkMode 
                          ? "border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-950/20 text-emerald-400" 
                          : "border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50 text-emerald-700")
                      : (isDarkMode
                          ? "border-gray-800 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 bg-[#0a0a0a] text-white"
                          : "border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-white text-gray-900")
                  }`}
                />

                {isValid && (
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-emerald-500" : "text-emerald-600"}`}>
                    <CheckCircle2 size={20} />
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg border transition-colors ${
                isDarkMode ? "bg-red-950/20 border-red-900/50 text-red-400" : "text-red-600 bg-red-50 border-red-200"
              }`}>
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {/* Button */}
            <button
              onClick={handleDelete}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all border ${
                loading
                  ? (isDarkMode ? "bg-red-900/50 text-white/50 border-transparent cursor-not-allowed" : "bg-red-400 text-white border-transparent cursor-not-allowed")
                  : isValid
                  ? (isDarkMode ? "bg-red-600 hover:bg-red-700 text-white border-transparent" : "bg-red-600 hover:bg-red-700 text-white border-transparent")
                  : (isDarkMode ? "bg-[#0a0a0a] text-gray-600 border-gray-800 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50" : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200")
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
          <div className={`border rounded-2xl p-8 text-center transition-colors ${
            isDarkMode ? "bg-emerald-950/20 border-emerald-900/30" : "bg-emerald-50 border-emerald-200"
          }`}>
            <CheckCircle2 size={32} className={`mx-auto mb-4 ${isDarkMode ? "text-emerald-500" : "text-emerald-600"}`} />
            <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-emerald-400" : "text-emerald-900"}`}>Account Deleted</h2>
            <p className={`text-sm ${isDarkMode ? "text-emerald-200/80" : "text-emerald-700"}`}>
              {message} Redirecting...
            </p>
          </div>
        )}

      </div>
    </div>
  );
}