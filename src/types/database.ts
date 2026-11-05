/** Typed Supabase schema (mirrors supabase/migrations/0001_init.sql). JSON columns are validated with Zod at the edges. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          address: string | null;
          locality: string | null;
          phone: string | null;
          website: string | null;
          services: string[] | null;
          brand_color: string | null;
          logo_path: string | null;
          client_since: string | null;
          hours: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          address?: string | null;
          locality?: string | null;
          phone?: string | null;
          website?: string | null;
          services?: string[] | null;
          brand_color?: string | null;
          logo_path?: string | null;
          client_since?: string | null;
          hours?: Json;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
        Relationships: [];
      };
      months: {
        Row: {
          id: string;
          client_id: string;
          period: string;
          published: boolean;
          nap: number | null;
          entity: number | null;
          schema_cov: number | null;
          knowledge: number | null;
          mentions: number | null;
          nap_fields: Json | null;
          entity_parts: Json | null;
          engines: Json | null;
          work: Json | null;
          sources: Json | null;
          forum: Json | null;
          note: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          period: string;
          published?: boolean;
          nap?: number | null;
          entity?: number | null;
          schema_cov?: number | null;
          knowledge?: number | null;
          mentions?: number | null;
          nap_fields?: Json | null;
          entity_parts?: Json | null;
          engines?: Json | null;
          work?: Json | null;
          sources?: Json | null;
          forum?: Json | null;
          note?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['months']['Insert']>;
        Relationships: [];
      };
      share_links: {
        Row: { token: string; client_id: string; created_at: string; revoked_at: string | null; last_viewed_at: string | null };
        Insert: { token: string; client_id: string; created_at?: string; revoked_at?: string | null; last_viewed_at?: string | null };
        Update: Partial<Database['public']['Tables']['share_links']['Insert']>;
        Relationships: [];
      };
      staff: {
        Row: { user_id: string; role: string | null };
        Insert: { user_id: string; role?: string | null };
        Update: Partial<Database['public']['Tables']['staff']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_report: { Args: { p_token: string }; Returns: Json };
      is_staff: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
