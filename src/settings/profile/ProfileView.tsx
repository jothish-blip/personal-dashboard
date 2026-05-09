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
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ✅ Load Profile with Auto-Create Fallback
  useEffect(() => {
    const load = async () => {
      // 🔥 FIX: Guard clause to ensure supabase is not null
      if (!supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const user = session.user;
      setUserId(user.id);
      setUserEmail(user.email ?? null);

      // 🔥 FIX: Cast to any to prevent 'never' type error
      let { data, error } = await (supabase.from("profiles") as any)
        .select(`id, full_name, username, bio, age, gender, location, avatar_url, updated_at`)
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch user profile:", JSON.stringify(error, null, 2));
      }

      // Auto-create profile if it doesn't exist yet
      if (!data && !error) {
        console.log("No profile found. Auto-creating...");
        
        // 🔥 FIX: Cast to any to prevent 'never' type error on insert
        const { data: newProfile, error: insertError } = await (supabase.from("profiles") as any)
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
          })
          .select(`id, full_name, username, bio, age, gender, location, avatar_url, updated_at`)
          .single();

        if (insertError) {
          console.error("Failed to auto-create profile:", JSON.stringify(insertError, null, 2));
        } else {
          data = newProfile;
        }
      }

      if (data) {
        setProfile(data as Profile);
      }
      
      setLoading(false);
    };

    load();
  }, [supabase]);

  // ✅ Avatar Upload (Optimized for Permanence)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      // 🔥 FIX: Guard clause
      if (!supabase) {
        setMessage({ type: "error", text: "Database connection failed." });
        return;
      }

      const file = e.target.files?.[0];
      if (!file || !userId || !profile) return;

      if (!file.type.startsWith("image/")) {
        setMessage({ type: "error", text: "Please upload an image file." });
        return;
      }

      setUploading(true);
      setMessage(null);

      const fileExt = file.name.split(".").pop();
      // Constant filename so it overwrites instead of filling up storage
      const filePath = `${userId}/profile_avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { 
            cacheControl: '31536000',
            upsert: true // Force Supabase to overwrite the old image
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;

      // 🔥 FIX: Cast to any to prevent 'never' type error on update
      const { error: updateError } = await (supabase.from("profiles") as any)
        .update({ 
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString() 
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: avatarUrl, updated_at: new Date().toISOString() });
      setMessage({ type: "success", text: "Photo updated permanently." });

    } catch (error) {
      console.error("Upload error:", JSON.stringify(error, null, 2));
      setMessage({ type: "error", text: "Failed to upload photo." });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // ✅ Update Profile
  const updateProfile = async () => {
    // 🔥 FIX: Guard clause
    if (!supabase) {
      setMessage({ type: "error", text: "Database connection failed." });
      return;
    }

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

    // 🔥 FIX: Cast to any to prevent 'never' type error on update
    const { error } = await (supabase.from("profiles") as any)
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
      console.error("Update failed:", JSON.stringify(error, null, 2));
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
            onClick={() => router.push("/settings/feedback")}
            className="text-sm text-gray-400 hover:text-black cursor-pointer transition-colors"
          >
            Give feedback →
          </p>
        </div>

      </div>
    </div>
  );
}