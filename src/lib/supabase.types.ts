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
      event_circle_links: {
        Row: {
          event_id: string;
          circle_id: string;
          status: "pending" | "approved" | "declined";
          requested_by: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          event_id: string;
          circle_id: string;
          status?: "pending" | "approved" | "declined";
          requested_by?: string | null;
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["event_circle_links"]["Insert"]>;
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
      import_sources: {
        Row: {
          id: string;
          name: string;
          type: "event" | "circle" | "deal" | "mixed";
          url: string;
          enabled: boolean;
          cadence: "manual" | "daily" | "weekly";
          last_scraped_at: string | null;
          last_status: string | null;
          error_count: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["import_sources"]["Row"]> & {
          id: string;
          name: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["import_sources"]["Insert"]>;
      };
      import_candidates: {
        Row: {
          id: string;
          source_id: string | null;
          source_name: string;
          source_url: string;
          item_url: string;
          type: "event" | "circle" | "deal";
          title: string;
          description: string;
          normalized_payload: Json;
          raw_payload: Json;
          confidence: number;
          duplicate_key: string;
          status: "new" | "approved" | "rejected" | "duplicate";
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["import_candidates"]["Row"]> & {
          id: string;
          item_url: string;
          type: "event" | "circle" | "deal";
          title: string;
          duplicate_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["import_candidates"]["Insert"]>;
      };
      circle_editors: {
        Row: { circle_id: string; user_id: string };
        Insert: { circle_id: string; user_id: string };
        Update: never;
      };
      circle_join_requests: {
        Row: { circle_id: string; user_id: string; status: "pending" | "approved" | "rejected"; message: string; created_at: string };
        Insert: { circle_id: string; user_id: string; status?: string; message?: string; created_at?: string };
        Update: Partial<{ status: string; message: string }>;
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
          slug: string | null;
          title: string;
          category: "Social" | "Career" | "Hackathon" | "Workshop" | "Casual" | "Travel";
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
          slug: string | null;
          brand: string;
          title: string;
          category: "Food & Drink" | "Technology" | "Fashion" | "Travel" | "Entertainment" | "Education" | "Beauty & Wellness" | "Lifestyle" | "Services" | "Careers" | "Other";
          original_price: string | null;
          new_price: string | null;
          sale_end: string | null;
          image_url: string | null;
          description: string | null;
          student_only: boolean;
          mode: "Online" | "In-Person" | "Both";
          social_links: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["deals"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
      };
      opportunities: {
        Row: {
          id: string;
          slug: string | null;
          company: string;
          role: string;
          type: "Shukatsu" | "Baito" | "Opportunity";
          organization: string;
          title: string;
          category: "Scholarship" | "Part-time Job" | "Internship" | "Study Abroad" | "Research" | "Competition" | "Grant" | "Volunteer" | "Career Event" | "Other";
          location: string;
          mode: "Online" | "In-Person" | "Hybrid";
          deadline: string | null;
          description: string;
          eligibility: string;
          application_url: string;
          tags: string[];
          emoji: string;
          image_url: string | null;
          social_links: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["opportunities"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["opportunities"]["Insert"]>;
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
