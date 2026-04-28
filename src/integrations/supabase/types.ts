export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          actor_id: string
          couple_id: string
          created_at: string
          id: string
          payload: Json
        }
        Insert: {
          activity_type: string
          actor_id: string
          couple_id: string
          created_at?: string
          id?: string
          payload?: Json
        }
        Update: {
          activity_type?: string
          actor_id?: string
          couple_id?: string
          created_at?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "activities_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_friendships: {
        Row: {
          couple_a: string
          couple_b: string
          created_at: string
          id: string
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          couple_a: string
          couple_b: string
          created_at?: string
          id?: string
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          couple_a?: string
          couple_b?: string
          created_at?: string
          id?: string
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_friendships_couple_a_fkey"
            columns: ["couple_a"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_friendships_couple_b_fkey"
            columns: ["couple_b"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_members: {
        Row: {
          couple_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          couple_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          couple_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          anniversary_date: string
          created_at: string
          created_by: string
          id: string
          invite_code: string | null
          invite_expires_at: string | null
          is_discoverable: boolean
          public_avatar_url: string | null
          public_city: string | null
          public_handle: string | null
          updated_at: string
        }
        Insert: {
          anniversary_date: string
          created_at?: string
          created_by: string
          id?: string
          invite_code?: string | null
          invite_expires_at?: string | null
          is_discoverable?: boolean
          public_avatar_url?: string | null
          public_city?: string | null
          public_handle?: string | null
          updated_at?: string
        }
        Update: {
          anniversary_date?: string
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string | null
          invite_expires_at?: string | null
          is_discoverable?: boolean
          public_avatar_url?: string | null
          public_city?: string | null
          public_handle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      day_memories: {
        Row: {
          couple_id: string
          created_at: string
          created_by: string
          id: string
          is_shared: boolean
          memory_date: string
          mood: string | null
          note: string | null
          title: string
          updated_at: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          created_by: string
          id?: string
          is_shared?: boolean
          memory_date: string
          mood?: string | null
          note?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_shared?: boolean
          memory_date?: string
          mood?: string | null
          note?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_memories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          couple_id: string
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          event_type: string
          google_event_id: string | null
          id: string
          recurrence: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          event_type?: string
          google_event_id?: string | null
          id?: string
          recurrence?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string
          google_event_id?: string | null
          id?: string
          recurrence?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          couple_id: string
          created_at: string
          created_by: string
          favorite_dish: string | null
          id: string
          image_url: string | null
          location: string | null
          name: string
          notes: string | null
          rating: number | null
          status: string
          updated_at: string
          visited_at: string | null
        }
        Insert: {
          couple_id: string
          created_at?: string
          created_by: string
          favorite_dish?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          notes?: string | null
          rating?: number | null
          status?: string
          updated_at?: string
          visited_at?: string | null
        }
        Update: {
          couple_id?: string
          created_at?: string
          created_by?: string
          favorite_dish?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          rating?: number | null
          status?: string
          updated_at?: string
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_posts: {
        Row: {
          caption: string
          couple_id: string
          created_at: string
          created_by: string
          id: string
          image_url: string | null
          kind: string
          ref_id: string | null
        }
        Insert: {
          caption: string
          couple_id: string
          created_at?: string
          created_by: string
          id?: string
          image_url?: string | null
          kind: string
          ref_id?: string | null
        }
        Update: {
          caption?: string
          couple_id?: string
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          kind?: string
          ref_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_posts_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          brand: string | null
          couple_id: string
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          for_whom: string
          id: string
          image_url: string | null
          price: number | null
          status: string
          status_date: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          brand?: string | null
          couple_id: string
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string | null
          for_whom?: string
          id?: string
          image_url?: string | null
          price?: number | null
          status?: string
          status_date?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          brand?: string | null
          couple_id?: string
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string | null
          for_whom?: string
          id?: string
          image_url?: string | null
          price?: number | null
          status?: string
          status_date?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_couples_friends: {
        Args: { _a: string; _b: string }
        Returns: boolean
      }
      get_user_couple_id: { Args: { _user_id: string }; Returns: string }
      is_couple_member: {
        Args: { _couple_id: string; _user_id: string }
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
