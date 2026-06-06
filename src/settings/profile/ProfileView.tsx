"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Profile } from "@/modules/tasks/types";
import { useTheme } from "@/theme/ThemeProvider";
import {
  User,
  Loader2,
  Camera,
  CheckCircle2,
  Settings,
  X
} from "lucide-react";

// Extend the base Profile type locally to avoid strict TS 'never' errors 
// until your global types are updated
type ExtendedProfile = Profile & {
  phone?: string;
  age?: number | null;
  discovery_source?: string;
  usage_reason?: string[];
  work_style?: string;
  planning_style?: string;
  onboarding_completed?: boolean;
};

export default function ProfilePage() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSetupBanner, setShowSetupBanner] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ✅ Load Profile with Auto-Create Fallback
  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const user = session.user;
      setUserId(user.id);
      setUserEmail(user.email ?? null);

      // Fetch extended fields
      let { data, error } = await (supabase.from("profiles") as any)
        .select(`
          id, full_name, username, bio, age, gender, location, avatar_url, updated_at,
          phone, discovery_source, usage_reason, work_style, planning_style, onboarding_completed
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch user profile:", error);
      }

      // Auto-create profile if it doesn't exist yet
      if (!data && !error) {
        const { data: newProfile, error: insertError } = await (supabase.from("profiles") as any)
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            onboarding_completed: false
          })
          .select()
          .single();

        if (!insertError) {
          data = newProfile;
        }
      }

      if (data) {
        setProfile(data as ExtendedProfile);
      }
      
      setLoading(false);
    };

    load();
  }, [supabase]);

  // ✅ Profile Completion Calculator
  const getCompletionStats = () => {
    if (!profile) return { pct: 0, missing: [] };
    
    const fields = [
      { key: 'avatar_url', label: 'Profile Photo' },
      { key: 'bio', label: 'Bio' },
      { key: 'age', label: 'Age' },
      { key: 'usage_reason', label: 'Goals', check: (p: any) => p.usage_reason?.length > 0 },
      { key: 'planning_style', label: 'Planning Style' }
    ];

    let filled = 0;
    const missing: string[] = [];

    fields.forEach(f => {
      const isFilled = f.check ? f.check(profile) : !!profile[f.key as keyof ExtendedProfile];
      if (isFilled) filled++;
      else missing.push(f.label);
    });

    return {
      pct: Math.round((filled / fields.length) * 100),
      missing
    };
  };

  const { pct: completionPct } = getCompletionStats();

  // ✅ Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
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
      const filePath = `${userId}/profile_avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { 
            cacheControl: '31536000',
            upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = data.publicUrl;

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
      console.error("Upload error:", error);
      setMessage({ type: "error", text: "Failed to upload photo." });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // ✅ Multi-select Helper
  const toggleUsageReason = (reason: string) => {
    if (!profile) return;
    const current = profile.usage_reason || [];
    const updated = current.includes(reason)
      ? current.filter(r => r !== reason)
      : [...current, reason];
    setProfile({ ...profile, usage_reason: updated });
  };

  // ✅ Update Profile
  const updateProfile = async () => {
    if (!supabase) {
      setMessage({ type: "error", text: "Database connection failed." });
      return;
    }

    if (!userId || !profile) return;

    if (!profile.full_name) {
      setMessage({ type: "error", text: "Name is required." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const { error } = await (supabase.from("profiles") as any)
      .update({
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
        age: profile.age,
        gender: profile.gender,
        location: profile.location,
        usage_reason: profile.usage_reason || [],
        work_style: profile.work_style,
        planning_style: profile.planning_style,
        onboarding_completed: true, // Mark completed if they save profile
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Update failed:", error);
      setMessage({ type: "error", text: "Update failed." });
    } else {
      setMessage({ type: "success", text: "Profile updated." });
      setProfile({ ...profile, onboarding_completed: true });
    }

    setIsSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading || !profile) {
    return (
      <div className={`flex items-center justify-center h-[60vh] transition-colors duration-300 ${
        isDarkMode ? "bg-[#050505]" : "bg-[#F9FAFB]"
      }`}>
        <Loader2 className={`animate-spin ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
      </div>
    );
  }

  const inputClasses = `w-full bg-transparent border-b py-2 text-sm focus:outline-none transition-colors duration-300 ${
    isDarkMode 
      ? "border-gray-800 text-white placeholder-gray-600 focus:border-orange-500" 
      : "border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-500"
  }`;

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${
      isDarkMode ? "bg-[#050505]" : "bg-[#F9FAFB]"
    }`}>
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-10 animate-in fade-in duration-500">
        
        {/* PROGRESSIVE ONBOARDING BANNER */}
        {!profile.onboarding_completed && showSetupBanner && completionPct < 100 && (
          <div className={`relative p-5 rounded-2xl border flex items-center justify-between shadow-sm overflow-hidden transition-colors duration-300 ${
            isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
          }`}>
            <div className={`absolute top-0 left-0 bottom-0 w-1 ${isDarkMode ? "bg-orange-500/50" : "bg-orange-500"}`} />
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <Settings size={16} className="text-orange-500" />
                Complete your setup
              </h3>
              <p className={`text-xs mt-1 transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Personalize NexSpace for a better experience.
              </p>
              
              <div className="flex items-center gap-3 mt-3">
                <div className={`h-1.5 w-32 rounded-full overflow-hidden transition-colors ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-700" 
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {completionPct}%
                </span>
              </div>
            </div>
            <button 
              onClick={() => setShowSetupBanner(false)}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-[#1a1a1a] text-gray-500" : "hover:bg-gray-100 text-gray-400"}`}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold tracking-tight transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Public Profile
          </h1>
          <p className={`text-sm mt-1 transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Manage your details and system preferences
          </p>
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
            <div className={`w-24 h-24 rounded-[2rem] overflow-hidden flex items-center justify-center relative shadow-sm border transition-colors duration-300 ${
              isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
            }`}>
              {uploading ? (
                <Loader2 className={`animate-spin w-6 h-6 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
              ) : profile.avatar_url ? (
                <img 
                  src={`${profile.avatar_url}?t=${new Date(profile.updated_at || "").getTime()}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User className={`w-10 h-10 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="text-white w-6 h-6" />
              </div>
            </div>
          </label>
          <div>
            <p className={`text-sm font-semibold transition-colors ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Profile photo</p>
            <p className={`text-xs mt-1 max-w-[180px] transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
              {uploading ? "Uploading..." : "Click image to change. PNG, JPG or GIF."}
            </p>
          </div>
        </div>

        <div className="space-y-12">
          
          {/* Basic Info Group */}
          <div className="space-y-6">
            <h2 className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              Basic Info
            </h2>

            <input
              value={userEmail || ""}
              disabled
              className={`w-full bg-transparent border-b py-2 text-sm focus:outline-none cursor-not-allowed transition-colors ${
                isDarkMode ? "border-gray-800 text-gray-600" : "border-gray-200 text-gray-400"
              }`}
            />

            <input
              placeholder="Full Name *"
              value={profile.full_name || ""}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className={inputClasses}
            />

            <input
              placeholder="Username"
              value={profile.username || ""}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className={inputClasses}
            />

            <textarea
              placeholder="Short Bio - What are you building or studying?"
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              className={`${inputClasses} resize-none`}
            />
          </div>

          {/* Personal Info Group */}
          <div className="space-y-6">
            <h2 className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              Personal Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="number"
                placeholder="Age"
                value={profile.age ?? ""}
                onChange={(e) => setProfile({ ...profile, age: e.target.value ? Number(e.target.value) : null })}
                className={inputClasses}
              />

              <select
                value={profile.gender || ""}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className={`${inputClasses} appearance-none`}
              >
                <option value="" disabled hidden className={isDarkMode ? "bg-[#111111] text-gray-500" : "bg-white text-gray-400"}>Gender</option>
                <option value="male" className={isDarkMode ? "bg-[#111111] text-white" : "bg-white text-gray-900"}>Male</option>
                <option value="female" className={isDarkMode ? "bg-[#111111] text-white" : "bg-white text-gray-900"}>Female</option>
                <option value="non-binary" className={isDarkMode ? "bg-[#111111] text-white" : "bg-white text-gray-900"}>Non-binary</option>
              </select>
            </div>

            <input
              placeholder="Location"
              value={profile.location || ""}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className={inputClasses}
            />
          </div>

          {/* NEXSPACE SYSTEM PREFERENCES (Progressive Onboarding Fields) */}
          <div className="space-y-6">
            <h2 className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              System Preferences
            </h2>

            <div className="space-y-3">
              <label className={`text-xs font-semibold transition-colors ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                What are your main goals?
              </label>
              <div className="flex flex-wrap gap-2">
                {["Focus", "Study", "Consistency", "Deep Work", "Task Management", "Planning", "Life Organization", "Career"].map(reason => {
                  const isSelected = profile.usage_reason?.includes(reason);
                  return (
                    <button
                      key={reason}
                      onClick={() => toggleUsageReason(reason)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border flex items-center gap-1.5 ${
                        isSelected
                          ? isDarkMode ? "bg-orange-950/30 border-orange-500/50 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-600"
                          : isDarkMode ? "bg-[#111111] border-gray-800 text-gray-400 hover:text-white" : "bg-white border-gray-200 text-gray-600 hover:text-black"
                      }`}
                    >
                      {isSelected && <CheckCircle2 size={12} />}
                      {reason}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className={`text-xs font-semibold transition-colors ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Work Style
                </label>
                <select
                  value={profile.work_style || ""}
                  onChange={(e) => setProfile({ ...profile, work_style: e.target.value })}
                  className={`${inputClasses} appearance-none`}
                >
                  <option value="" disabled hidden className={isDarkMode ? "bg-[#111111] text-gray-500" : "bg-white text-gray-400"}>Select work style...</option>
                  <option value="I need structure" className={isDarkMode ? "bg-[#111111] text-white" : "bg-white text-gray-900"}>I need structure</option>
                  <option value="I struggle with consistency" className={isDarkMode ? "bg-[#111111] text-white" : "bg-white text-gray-900"}>I struggle with consistency</option>
                  <option value="I already have systems" className={isDarkMode ? "bg-[#111111] text-white" : "bg-white text-gray-900"}>I already have systems</option>
                  <option value="Still figuring things out" className={isDarkMode ? "bg-[#111111] text-white" : "bg-white text-gray-900"}>Still figuring things out</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className={`text-xs font-semibold transition-colors ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Planning Style
                </label>
                <select
                  value={profile.planning_style || ""}
                  onChange={(e) => setProfile({ ...profile, planning_style: e.target.value })}
                  className={`${inputClasses} appearance-none`}
                >
                  <option value="" disabled hidden className={isDarkMode ? "bg-[#111111] text-gray-500" : "bg-white text-gray-400"}>Select planning style...</option>
                  <option value="No planning" className={isDarkMode ? "bg-[#111111] text-white" : "bg-white text-gray-900"}>No planning</option>
                  <option value="Mental planning" className={isDarkMode ? "bg-[#111111] text-white" : "bg-white text-gray-900"}>Mental planning</option>
                  <option value="Calendar" className={isDarkMode ? "bg-[#111111] text-white" : "bg-white text-gray-900"}>Calendar</option>
                  <option value="Todo app" className={isDarkMode ? "bg-[#111111] text-white" : "bg-white text-gray-900"}>Todo app</option>
                  <option value="Structured system" className={isDarkMode ? "bg-[#111111] text-white" : "bg-white text-gray-900"}>Structured system</option>
                </select>
              </div>
            </div>

          </div>

          {/* Footer actions (🔥 FIX: Strict Hex Codes for guaranteed contrast in both modes) */}
          <div className={`pt-6 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
            isDarkMode ? "border-gray-800" : "border-gray-100"
          }`}>
            <div className="flex items-center gap-4">
              <button
                onClick={updateProfile}
                disabled={isSaving}
                className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-transparent ${
                  isDarkMode 
                    ? "bg-[#eeeeee] text-[#111111] hover:bg-[#ffffff] shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                    : "bg-[#111111] text-[#ffffff] hover:bg-[#000000] shadow-md"
                }`}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              
              {message && (
                <span className={`text-xs font-semibold animate-in fade-in slide-in-from-left-2 transition-colors ${
                  message.type === "success" 
                    ? (isDarkMode ? "text-emerald-400" : "text-emerald-600") 
                    : (isDarkMode ? "text-red-400" : "text-red-500")
                }`}>
                  {message.text}
                </span>
              )}
            </div>

            <button
              onClick={() => router.push("/settings/feedback")}
              className={`text-xs font-semibold transition-colors ${
                isDarkMode ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-black"
              }`}
            >
              Give feedback →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}