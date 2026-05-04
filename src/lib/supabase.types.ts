export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string | null;
          display_name: string;
          university: string;
          year: string;
          bio: string;
          avatar_url: string | null;
          tags: string[];
          interests: string[];
          career_field: string;
          goals: string[];
          role: "user" | "admin";
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "updated_at"> & {
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      event_attendees: {
        Row: { event_id: string; user_id: string; status: "pending" | "approved" | "declined"; created_at: string };
        Insert: { event_id: string; user_id: string; status?: string; created_at?: string };
        Update: Partial<{ status: string }>;
      };
      notifications: {
        Row: { id: string; user_id: string; type: string; payload: Json; read: boolean; created_at: string };
        Insert: { id?: string; user_id: string; type: string; payload?: Json; read?: boolean; created_at?: string };
        Update: Partial<{ read: boolean }>;
      };
      user_circles: {
        Row: { user_id: string; circle_id: string; joined_at: string };
        Insert: { user_id: string; circle_id: string; joined_at?: string };
        Update: never;
      };
      circles: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string;
          members: number;
          activity: "Daily" | "Weekly" | "Monthly" | "Occasionally";
          english_friendly: boolean;
          emoji: string;
          owner_id: string | null;
          icon_url: string | null;
          tags: string[];
          social_links: Json;
          membership_fee: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["circles"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["circles"]["Insert"]>;
      };
      events: {
        Row: {
          id: string;
          title: string;
          category: "Social" | "Career" | "Hackathon" | "Networking";
          date: string;
          location: string;
          description: string;
          emoji: string;
          going: number;
          tags: string[];
          social_links: Json;
          cost: string | null;
          primary_language: string | null;
          owner_id: string | null;
          circle_ids: string[];
          online: boolean;
          approval_required: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["events"]["Row"], "created_at" | "updated_at" | "circle_ids"> & {
          created_at?: string;
          updated_at?: string;
          circle_ids?: string[];
          online?: boolean;
          approval_required?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
      };
      deals: {
        Row: {
          id: string;
          brand: string;
          title: string;
          category: "Food" | "Fashion" | "Lifestyle";
          discount: string;
          area: string;
          emoji: string;
          social_links: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["deals"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
      };
      jobs: {
        Row: {
          id: string;
          company: string;
          role: string;
          type: "Shukatsu" | "Baito" | "Opportunity";
          location: string;
          tags: string[];
          emoji: string;
          social_links: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["jobs"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
      };
      guides: {
        Row: {
          id: string;
          title: string;
          section: "Housing" | "Admin" | "Daily Life";
          excerpt: string;
          emoji: string;
          read_time: string;
          social_links: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["guides"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["guides"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
