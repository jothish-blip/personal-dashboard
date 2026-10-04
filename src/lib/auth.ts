"use client";

import { User, Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase";

export interface LastLoggedInAccount {
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  provider?: string | null;
  lastLoginAt: number;
}

const LAST_ACCOUNT_KEY = "nexspace_last_account";

/**
 * Retrieves the non-sensitive account-recognition metadata for the last logged-in account.
 * Note: This is strictly for UI recognition and never acts as an authentication authority.
 */
export function getLastLoggedInAccount(): LastLoggedInAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_ACCOUNT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastLoggedInAccount;
  } catch (e) {
    console.error("Failed to parse last logged in account:", e);
    return null;
  }
}

/**
 * Saves non-sensitive account recognition info when a user successfully authenticates.
 */
export function setLastLoggedInAccount(info: {
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  provider?: string | null;
}): void {
  if (typeof window === "undefined") return;
  try {
    const account: LastLoggedInAccount = {
      email: info.email ?? null,
      name: info.name ?? null,
      avatar_url: info.avatar_url ?? null,
      provider: info.provider ?? null,
      lastLoginAt: Date.now(),
    };
    localStorage.setItem(LAST_ACCOUNT_KEY, JSON.stringify(account));
  } catch (e) {
    console.error("Failed to save last logged in account:", e);
  }
}

/**
 * Clears the last logged in account information if the user chooses to switch or forget it.
 */
export function clearLastLoggedInAccount(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LAST_ACCOUNT_KEY);
}

/**
 * Purges all user-specific data from local caches, storage, and queues upon logout.
 * Ensures a subsequent login on the same browser cannot inherit another account's state.
 */
export function clearUserDataOnLogout(userId?: string): void {
  if (typeof window === "undefined") return;

  try {
    // 1. Clear session storage
    sessionStorage.clear();

    // 2. Clear known legacy and global keys
    const legacyKeys = [
      "NEXSPACE_V12_PRO_FINAL",
      "nex_offline_queue",
      "nexspace_tasks",
      "activeWorkspace",
      "matrix_help_seen_v2",
      "matrix_focus_mode",
      "matrix_swipe_hint_seen",
      "matrix_collapsed_groups",
      "matrix_has_swiped_week",
      "taskflow_planner_v1",
      "app_status_seen",
      "nexspace_workspace_wip_seen",
      "nexspace_session_loaded",
      "nexengine_active_tab",
      "temp_activity_tick"
    ];

    legacyKeys.forEach((key) => localStorage.removeItem(key));

    // 3. Scan and remove all user-scoped keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (
        key.startsWith("NEXSPACE_TASKS_CACHE_") ||
        key.startsWith("nex_offline_queue_") ||
        key.startsWith("nexspace_profile_") ||
        key.startsWith("played_sessions_") ||
        key.startsWith("daily_goal_") ||
        key.startsWith("focus_active_session_") ||
        key.startsWith("focus_checkpoint_") ||
        key.startsWith("focus_complete_signal_") ||
        key.startsWith("focus_stop_signal_") ||
        key.startsWith("taskflow_planner_v1_") ||
        key.startsWith("nexspace_diary_") ||
        key.startsWith("nexspace-") ||
        key.startsWith("activeWorkspace_") ||
        key.startsWith("missed_notified_") ||
        key.startsWith("planner_") ||
        (userId && key.includes(userId))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // 4. Dispatch a custom logout event so all in-memory React state resets immediately
    window.dispatchEvent(new Event("nexspace-logout"));
  } catch (err) {
    console.error("Error clearing user storage on logout:", err);
  }
}

/**
 * Universal logout handler that:
 * 1. Captures last account info for recognition
 * 2. Clears user personal data and caches
 * 3. Signs out of Supabase
 * 4. Safely redirects to /login
 */
/**
 * Extracts non-sensitive user identity details (name, avatar, provider) from Supabase User metadata.
 * Works across Google, GitHub, Discord, and Email providers.
 */
export function extractUserMetadata(user: User): {
  name: string;
  avatar_url: string | null;
  provider: string;
  email: string | null;
} {
  const meta = user.user_metadata || {};
  const identityData = user.identities?.[0]?.identity_data || {};

  // Provider
  const rawProvider =
    user.app_metadata?.provider ||
    user.identities?.[0]?.provider ||
    "OAuth";
  const provider = rawProvider.charAt(0).toUpperCase() + rawProvider.slice(1);

  // Name resolution
  const name =
    meta.full_name ||
    meta.name ||
    meta.preferred_username ||
    meta.user_name ||
    identityData.full_name ||
    identityData.name ||
    identityData.preferred_username ||
    identityData.user_name ||
    (user.email ? user.email.split("@")[0] : "User");

  // Avatar URL resolution across Google (picture), GitHub (avatar_url), Discord (avatar_url/picture)
  const avatar_url =
    meta.avatar_url ||
    meta.picture ||
    meta.image ||
    identityData.avatar_url ||
    identityData.picture ||
    null;

  return {
    name,
    avatar_url,
    provider,
    email: user.email ?? null,
  };
}

/**
 * Universal logout handler that:
 * 1. Captures last account info for recognition
 * 2. Clears user personal data and caches
 * 3. Signs out of Supabase
 * 4. Safely redirects to /login
 */
export async function logoutUser(router?: { replace: (url: string) => void }): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const meta = extractUserMetadata(session.user);

        // Fetch DB profile to get latest customized avatar or name if user edited it
        let customAvatar = meta.avatar_url;
        let customName = meta.name;

        try {
          const { data: profile } = await (supabase as any)
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profile?.avatar_url) customAvatar = profile.avatar_url;
          if (profile?.full_name) customName = profile.full_name;
        } catch (_) {}

        setLastLoggedInAccount({
          email: session.user.email,
          name: customName,
          avatar_url: customAvatar,
          provider: meta.provider,
        });
        clearUserDataOnLogout(session.user.id);
      } else {
        clearUserDataOnLogout();
      }

      await supabase.auth.signOut();
    } catch (e) {
      console.error("Supabase signOut error:", e);
      clearUserDataOnLogout();
    }
  } else {
    clearUserDataOnLogout();
  }

  if (router && typeof router.replace === "function") {
    router.replace("/login");
  } else if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/**
 * Authoritatively verifies the Supabase authenticated session and user identity.
 * Avoids assuming authentication succeeded merely from client state.
 */
export async function verifyAuthenticatedSession(): Promise<{ user: User; session: Session } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    // 1. Retrieve session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return null;
    }

    // 2. Authoritatively verify authenticated user with Supabase Auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      // Session might be expired; attempt token refresh
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session || !refreshData.user) {
        return null;
      }
      return { user: refreshData.user, session: refreshData.session };
    }

    return { user, session };
  } catch (err) {
    console.error("Authentication session verification failed:", err);
    return null;
  }
}

/**
 * Ensures a valid profile row exists in the profiles table for the exact auth.users.id.
 * Synchronizes provider avatar and name if missing without overwriting user-edited data.
 */
export async function ensureUserProfile(user: User): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !user?.id) return false;

  try {
    const { data: existingProfile, error: selectError } = await (supabase as any)
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (selectError) {
      console.error("Error verifying profile existence:", selectError);
    }

    const meta = extractUserMetadata(user);

    if (!existingProfile) {
      const profileData = {
        id: user.id,
        full_name: meta.name,
        avatar_url: meta.avatar_url,
        updated_at: new Date().toISOString(),
        onboarding_completed: true, // Direct entry, no onboarding wall
      };

      const { error: insertError } = await (supabase as any)
        .from("profiles")
        .insert(profileData);

      if (insertError) {
        console.error("Error creating user profile:", insertError);
        return false;
      }
    } else {
      // If profile exists, backfill avatar_url or full_name only if currently empty
      const updates: any = {};
      if (!existingProfile.avatar_url && meta.avatar_url) {
        updates.avatar_url = meta.avatar_url;
      }
      if (!existingProfile.full_name && meta.name) {
        updates.full_name = meta.name;
      }
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await (supabase as any).from("profiles").update(updates).eq("id", user.id);
      }
    }

    return true;
  } catch (err) {
    console.error("Failed to ensure user profile:", err);
    return false;
  }
}

