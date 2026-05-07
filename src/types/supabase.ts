export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          username: string | null;
          bio: string | null;
          avatar_url: string | null;
          age: number | null;
          gender: string | null;
          location: string | null;
          onboarding_seen: boolean | null;
          focus_guide_seen: boolean | null;
          diary_guide_seen: boolean | null;
          progress_guide_seen: boolean | null;
          workspace_guide_seen: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          age?: number | null;
          gender?: string | null;
          location?: string | null;
          onboarding_seen?: boolean | null;
          focus_guide_seen?: boolean | null;
          diary_guide_seen?: boolean | null;
          progress_guide_seen?: boolean | null;
          workspace_guide_seen?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          full_name?: string | null;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          age?: number | null;
          gender?: string | null;
          location?: string | null;
          onboarding_seen?: boolean | null;
          focus_guide_seen?: boolean | null;
          diary_guide_seen?: boolean | null;
          progress_guide_seen?: boolean | null;
          workspace_guide_seen?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
};
