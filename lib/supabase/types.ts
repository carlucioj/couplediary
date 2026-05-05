/**
 * Database types for CoupleDiary
 * 
 * These types provide full type safety for all database operations.
 * Update this file when the database schema changes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          couple_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          couple_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          couple_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          }
        ]
      }
      couples: {
        Row: {
          id: string
          name: string | null
          anniversary_date: string | null
          invite_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          anniversary_date?: string | null
          invite_code?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          anniversary_date?: string | null
          invite_code?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      diary_entries: {
        Row: {
          id: string
          couple_id: string
          author_id: string
          title: string
          content: string
          mood: string | null
          is_private: boolean
          media_urls: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          author_id: string
          title: string
          content: string
          mood?: string | null
          is_private?: boolean
          media_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          author_id?: string
          title?: string
          content?: string
          mood?: string | null
          is_private?: boolean
          media_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_entries_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      memories: {
        Row: {
          id: string
          couple_id: string
          author_id: string
          title: string
          description: string | null
          date: string
          location: string | null
          media_urls: string[] | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          author_id: string
          title: string
          description?: string | null
          date: string
          location?: string | null
          media_urls?: string[] | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          author_id?: string
          title?: string
          description?: string | null
          date?: string
          location?: string | null
          media_urls?: string[] | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      special_dates: {
        Row: {
          id: string
          couple_id: string
          title: string
          date: string
          type: string
          reminder_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          title: string
          date: string
          type?: string
          reminder_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          title?: string
          date?: string
          type?: string
          reminder_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_dates_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_couple_member: {
        Args: {
          _couple_id: string
        }
        Returns: boolean
      }
      generate_invite_code: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Profile = Tables<'profiles'>
export type Couple = Tables<'couples'>
export type DiaryEntry = Tables<'diary_entries'>
export type Memory = Tables<'memories'>
export type SpecialDate = Tables<'special_dates'>
export type AuditLog = Tables<'audit_logs'>
