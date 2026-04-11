"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Profile } from "@/types";

import {
  User,
  Loader2,
  Camera,
} from "lucide-react";

export default function ProfilePage() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false); // 🔥 New: Avatar specifically
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
        .select(`id, full_name, username, bio, age, gender, location, avatar_url, updated_at`)
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

  // ✅ Avatar Upload (Corrected Logic)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !userId || !profile) return;

      // 1. Validate File Type
      if (!file.type.startsWith("image/")) {
        setMessage({ type: "error", text: "Please upload an image file." });
        return;
      }

      setUploading(true);
      setMessage(null);

      const fileExt = file.name.split(".").pop();
      // 🚀 FIX 1: Use timestamp in filename to break CDN/Browser cache
      const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { 
            cacheControl: '3600',
            upsert: false // Set to false since name is now unique
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;

      // Update Database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString() 
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Update Local State
      setProfile({ ...profile, avatar_url: avatarUrl });
      setMessage({ type: "success", text: "Photo updated." });

    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: "Failed to upload photo." });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(null), 3000);
    }
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
        updated_at: new Date().toISOString(),
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
      <div className="flex items-center gap-6">
        <label className="relative cursor-pointer group">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={uploading}
          />
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-100 flex items-center justify-center relative shadow-sm">
            {uploading ? (
              <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
            ) : profile.avatar_url ? (
              // 🚀 FIX 2: Append timestamp to the src to force a re-render from cache
              <img 
                src={`${profile.avatar_url}?t=${new Date(profile.updated_at || "").getTime()}`} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <User className="text-gray-400 w-10 h-10" />
            )}
            
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="text-white w-6 h-6" />
            </div>
          </div>
        </label>
        <div>
          <p className="text-sm font-semibold text-gray-900">Profile photo</p>
          <p className="text-xs text-gray-500 mt-1 max-w-[180px]">
            {uploading ? "Uploading..." : "Click image to change. PNG, JPG or GIF."}
          </p>
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
            
            {message && (
              <span className={`text-sm animate-in fade-in slide-in-from-left-2 ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}>
                {message.text}
              </span>
            )}
          </div>

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