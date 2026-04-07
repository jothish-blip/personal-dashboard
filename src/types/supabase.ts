export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          age: number | null;
          gender: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          age?: number | null;
          gender?: string | null;
          updated_at?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          age?: number | null;
          gender?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
};