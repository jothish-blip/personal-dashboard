"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { 
  ArrowLeft, 
  User, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Shield,
  Bell
} from "lucide-react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const supabase = getSupabaseClient();

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        const user = session.user;
        setUserId(user.id);
        setUserEmail(user.email ?? null);

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Fetch profile error:", error);
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router, supabase]); 

  const updateProfile = async () => {
    if (!userId || !profile) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const updateData = {
        full_name: profile.full_name,
        age: profile.age,
        gender: profile.gender,
      };

      // 🔥 FIX: Cast the entire query builder to 'any' to completely bypass the 'never' parameter error
      const { error } = await (supabase.from("profiles") as any)
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Update error:", err);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <div className="text-gray-500 text-sm font-medium tracking-wide">
            Loading your preferences...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 pb-20 font-sans">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-md"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <div className="font-bold tracking-tight text-gray-800">NexTask Settings</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10 flex flex-col md:flex-row gap-10">
        
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Account</h2>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-200/50 text-black rounded-lg font-medium text-sm transition-colors">
            <User size={18} className="text-gray-700" />
            Public Profile
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-gray-100 hover:text-black rounded-lg font-medium text-sm transition-colors cursor-not-allowed opacity-50">
            <Shield size={18} />
            Security
          </button>
          
          {/* ✅ UPDATED: Notifications Button now routes to Notification Center */}
          <button 
            onClick={() => router.push('/notifications')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-gray-100 hover:text-black rounded-lg font-medium text-sm transition-colors"
          >
            <Bell size={18} />
            Notifications
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-3xl space-y-8">
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Public Profile</h1>
            <p className="text-gray-500 mt-2 text-sm">Update your personal details and how others see you on the platform.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Profile Avatar Section */}
            <div className="p-8 border-b border-gray-100 flex items-center gap-6">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center shadow-sm overflow-hidden shrink-0 transition-opacity group-hover:opacity-90">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-gray-300" />
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-semibold text-white">Edit</span>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-gray-900">Profile Picture</h3>
                <p className="text-sm text-gray-500">PNG, JPG or GIF up to 2MB. (Coming soon)</p>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-8 space-y-6">
              
              <div className="space-y-6">
                {/* EMAIL (Read Only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={userEmail || ""}
                      disabled
                      className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-lg pl-10 p-2.5 text-sm cursor-not-allowed shadow-inner"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Email cannot be changed directly. Contact support if needed.</p>
                </div>

                <hr className="border-gray-100" />

                {/* FULL NAME */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    value={profile.full_name || ""}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5 transition-colors shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* AGE */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Age
                    </label>
                    <input
                      type="number"
                      value={profile.age ?? ""}
                      onChange={(e) => setProfile({
                        ...profile,
                        age: e.target.value ? Number(e.target.value) : null,
                      })}
                      placeholder="e.g. 25"
                      className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5 transition-colors shadow-sm"
                    />
                  </div>

                  {/* GENDER */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Gender
                    </label>
                    <select
                      value={profile.gender || ""}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5 transition-colors shadow-sm appearance-none"
                    >
                      <option value="" disabled>Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {message.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-red-600" />}
                  {message.text}
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
                <button
                  onClick={updateProfile}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 w-full md:w-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
                {/* 🚧 TEMPORARY DEV BUTTON - REMOVE BEFORE LAUNCH 🚧 */}
<button 
  onClick={() => {
    localStorage.removeItem("nextask_onboarding_seen");
    window.location.href = "/"; // Reloads the dashboard
  }}
  className="mt-8 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors"
>
  Dev Mode: Reset Onboarding
</button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}