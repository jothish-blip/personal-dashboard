"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/theme/ThemeProvider";
import {
  ChevronRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

export default function ContactPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const supabase = getSupabaseClient();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    msg: string;
  }>({ type: null, msg: "" });

  const [cooldown, setCooldown] = useState(0);

  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "general",
    message: "",
  });

  // ✅ Load user safely
  useEffect(() => {
    const loadUser = async () => {
      if (!supabase) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const u = session.user;
        setUser(u);

        setForm((prev) => ({
          ...prev,
          email: u.email || "",
          name:
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            "",
        }));
      }
    };

    loadUser();
  }, [supabase]);

  // ✅ Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // ✅ Submit handler
  const handleSubmit = async () => {
    if (!form.email || !form.message) {
      setStatus({ type: "error", msg: "Required fields missing." });
      return;
    }

    if (cooldown > 0) return;

    if (!supabase) {
      setStatus({ type: "error", msg: "Database connection failed. Please try again later." });
      return;
    }

    setLoading(true);
    setStatus({ type: null, msg: "" });

    try {
      const { error } = await (supabase as any).from("contact_messages").insert([
        {
          user_id: user?.id ?? null,
          name: form.name || null,
          email: form.email,
          category: form.category,
          message: form.message,
        },
      ]);

      if (error) {
        console.error("FULL ERROR:", JSON.stringify(error, null, 2));
        throw error;
      }

      setStatus({ type: "success", msg: "Message sent successfully." });
      setCooldown(30);

      setForm({
        name: form.name,
        email: user?.email || "",
        category: "general",
        message: "",
      });

    } catch (err) {
      setStatus({ type: "error", msg: "Failed to send message." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10 relative pt-8">

      {/* Header */}
      <div>
        <div className={`flex items-center text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          <button 
            onClick={() => router.back()} 
            className={`flex items-center gap-1 cursor-pointer transition-colors ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}
          >
            <ArrowLeft size={14} />
            Back to previous page
          </button>
          <ChevronRight size={14} className="mx-2" />
          <span className={`font-medium ${isDarkMode ? "text-white" : "text-black"}`}>Contact</span>
        </div>

        <h1 className={`text-2xl md:text-3xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Contact Support
        </h1>
        <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Reach out for help, feedback, or issues.
        </p>
        
        {/* Support Email Visibility */}
        <p className={`text-sm mt-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Support Email:{" "}
          <a 
            href="mailto:support@nexspace.space" 
            className={`hover:underline ${isDarkMode ? "text-orange-400" : "text-orange-500"}`}
          >
            support@nexspace.space
          </a>
        </p>
      </div>

      {/* Status */}
      {status.type && (
        <div
          className={`text-sm flex items-center gap-2 ${
            status.type === "success"
              ? isDarkMode ? "text-green-400" : "text-green-600"
              : isDarkMode ? "text-red-400" : "text-red-600"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {status.msg}
        </div>
      )}

      {/* Form */}
      <div className="space-y-8">

        {/* Name + Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <input
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            placeholder="Name"
            className={`w-full border-b py-2 text-sm focus:outline-none bg-transparent transition-colors ${
              isDarkMode 
                ? "border-gray-800 text-white focus:border-gray-400 placeholder-gray-600" 
                : "border-gray-200 text-black focus:border-black placeholder-gray-400"
            }`}
          />

          <input
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            placeholder="Email *"
            className={`w-full border-b py-2 text-sm focus:outline-none bg-transparent transition-colors ${
              isDarkMode 
                ? "border-gray-800 text-white focus:border-gray-400 placeholder-gray-600" 
                : "border-gray-200 text-black focus:border-black placeholder-gray-400"
            }`}
          />

        </div>

        {/* Category */}
        <select
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
          className={`w-full border-b py-2 text-sm focus:outline-none bg-transparent transition-colors ${
            isDarkMode 
              ? "border-gray-800 text-white focus:border-gray-400 [&>option]:bg-[#0a0a0a]" 
              : "border-gray-200 text-black focus:border-black"
          }`}
        >
          <option value="general">General</option>
          <option value="bug">Bug Report</option>
          <option value="feature">Feature Request</option>
          <option value="account">Account Issue</option>
        </select>

        {/* Message */}
        <textarea
          value={form.message}
          onChange={(e) =>
            setForm({ ...form, message: e.target.value })
          }
          rows={5}
          placeholder="Your message..."
          className={`w-full border-b py-2 text-sm focus:outline-none resize-none bg-transparent transition-colors ${
            isDarkMode 
              ? "border-gray-800 text-white focus:border-gray-400 placeholder-gray-600" 
              : "border-gray-200 text-black focus:border-black placeholder-gray-400"
          }`}
        />

        {/* Button */}
        <div className="flex items-center justify-between pt-4">

          <button
            onClick={handleSubmit}
            disabled={loading || cooldown > 0}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-md transition disabled:opacity-40 ${
              isDarkMode 
                ? "bg-white text-black hover:bg-gray-200" 
                : "bg-black text-white hover:opacity-90"
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                {cooldown > 0 ? `Wait ${cooldown}s` : "Send"}
                <Send size={14} />
              </>
            )}
          </button>

          <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Response within 24h
          </p>

        </div>

      </div>
    </div>
  );
}