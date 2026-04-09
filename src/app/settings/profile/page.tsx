"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Profile } from "@/types";

import {
  User,
  Loader2,
} from "lucide-react";

export default function ProfilePage() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ✅ Load Profile
  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const user = session.user;
      setUserId(user.id);
      setUserEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          username,
          bio,
          age,
          gender,
          location,
          avatar_url,
          updated_at
        `)
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setProfile(data as Profile);
      }

      setLoading(false);
    };

    load();
  }, [supabase]);

  // ✅ Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !profile) return;

    const fileExt = file.name.split(".").pop();
    // Using folder-based structure for better RLS and scalability
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const avatarUrl = data.publicUrl;

    await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId);

    setProfile({ ...profile, avatar_url: avatarUrl });
  };

  // ✅ Update Profile
  const updateProfile = async () => {
    if (!userId || !profile) return;

    if (!profile.full_name || !profile.username) {
      setMessage({
        type: "error",
        text: "Name and username are required.",
      });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
        age: profile.age,
        gender: profile.gender,
        location: profile.location,
      })
      .eq("id", userId);

    if (error) {
      setMessage({ type: "error", text: "Update failed." });
    } else {
      setMessage({ type: "success", text: "Profile updated." });
    }

    setIsSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Public Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your details</p>
      </div>

      {/* Avatar Section */}
      <div className="flex items-center gap-5">
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="text-gray-400 w-8 h-8" />
            )}
          </div>
        </label>
        <div>
          <p className="text-sm font-medium text-gray-900">Profile photo</p>
          <p className="text-xs text-gray-500 mt-0.5">Click to change</p>
        </div>
      </div>

      <div className="space-y-10">
        
        {/* Basic Info Group */}
        <div className="space-y-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Basic Info
          </h2>

          <input
            value={userEmail || ""}
            disabled
            className="w-full bg-transparent border-b border-gray-200 py-2 text-sm text-gray-500 focus:outline-none cursor-not-allowed"
          />

          <input
            placeholder="Full Name *"
            value={profile.full_name || ""}
            onChange={(e) =>
              setProfile({ ...profile, full_name: e.target.value })
            }
            className="w-full bg-transparent border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors"
          />

          <input
            placeholder="Username *"
            value={profile.username || ""}
            onChange={(e) =>
              setProfile({ ...profile, username: e.target.value })
            }
            className="w-full bg-transparent border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors"
          />

          <textarea
            placeholder="Bio"
            value={profile.bio || ""}
            onChange={(e) =>
              setProfile({ ...profile, bio: e.target.value })
            }
            rows={3}
            className="w-full bg-transparent border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors resize-none"
          />
        </div>

        {/* Personal Info Group */}
        <div className="space-y-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Personal Info
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="number"
              placeholder="Age"
              value={profile.age ?? ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  age: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full bg-transparent border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors"
            />

            <select
              value={profile.gender || ""}
              onChange={(e) =>
                setProfile({ ...profile, gender: e.target.value })
              }
              className="w-full bg-transparent border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors appearance-none bg-none"
            >
              <option value="" disabled hidden>Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
            </select>
          </div>

          <input
            placeholder="Location"
            value={profile.location || ""}
            onChange={(e) =>
              setProfile({ ...profile, location: e.target.value })
            }
            className="w-full bg-transparent border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>

        {/* Footer actions */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={updateProfile}
              disabled={isSaving}
              className="px-5 py-2 text-sm font-medium bg-black text-white rounded-md hover:opacity-90 transition disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            
            {/* Minimal Message UI */}
            {message && (
              <span className={`text-sm ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}>
                {message.text}
              </span>
            )}
          </div>

          {/* Feedback Link */}
          <p
            onClick={() => router.push("/feedback")}
            className="text-sm text-gray-400 hover:text-black cursor-pointer transition-colors"
          >
            Give feedback →
          </p>
        </div>

      </div>
    </div>
  );
}