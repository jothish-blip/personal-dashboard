"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

export default function ContactPage() {
  const router = useRouter();
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

  // ✅ Load user safely (NO LOCK ISSUE)
  useEffect(() => {
    const loadUser = async () => {
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

  // ✅ Submit handler (FINAL SAFE VERSION)
  const handleSubmit = async () => {
    if (!form.email || !form.message) {
      setStatus({ type: "error", msg: "Required fields missing." });
      return;
    }

    if (cooldown > 0) return;

    setLoading(true);
    setStatus({ type: null, msg: "" });

    try {
      const { error } = await supabase.from("contact_messages").insert([
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
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">

      {/* Header */}
      <div>
        <div className="flex items-center text-sm text-gray-400 mb-2">
          <span
            onClick={() => router.push("/settings")}
            className="cursor-pointer hover:text-black"
          >
            Settings
          </span>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-gray-800">Contact</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold">
          Contact Support
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Reach out for help, feedback, or issues.
        </p>
      </div>

      {/* Status */}
      {status.type && (
        <div
          className={`text-sm flex items-center gap-2 ${
            status.type === "success"
              ? "text-green-600"
              : "text-red-600"
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
            className="w-full border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black"
          />

          <input
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            placeholder="Email *"
            className="w-full border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black"
          />

        </div>

        {/* Category */}
        <select
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
          className="w-full border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent"
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
          className="w-full border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black resize-none"
        />

        {/* Button */}
        <div className="flex items-center justify-between pt-4">

          <button
            onClick={handleSubmit}
            disabled={loading || cooldown > 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-black text-white rounded-md hover:opacity-90 transition disabled:opacity-40"
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

          <p className="text-xs text-gray-400">
            Response within 24h
          </p>

        </div>

      </div>
    </div>
  );
}