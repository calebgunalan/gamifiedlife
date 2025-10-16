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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          area: Database["public"]["Enums"]["life_area"] | null
          code: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          area?: Database["public"]["Enums"]["life_area"] | null
          code: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          area?: Database["public"]["Enums"]["life_area"] | null
          code?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      activities: {
        Row: {
          area: Database["public"]["Enums"]["life_area"]
          created_at: string | null
          frequency: string | null
          id: string
          is_custom: boolean | null
          name: string
          user_id: string
          xp_value: number
        }
        Insert: {
          area: Database["public"]["Enums"]["life_area"]
          created_at?: string | null
          frequency?: string | null
          id?: string
          is_custom?: boolean | null
          name: string
          user_id: string
          xp_value: number
        }
        Update: {
          area?: Database["public"]["Enums"]["life_area"]
          created_at?: string | null
          frequency?: string | null
          id?: string
          is_custom?: boolean | null
          name?: string
          user_id?: string
          xp_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          activity_id: string
          area: Database["public"]["Enums"]["life_area"]
          completed_at: string | null
          id: string
          notes: string | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          activity_id: string
          area: Database["public"]["Enums"]["life_area"]
          completed_at?: string | null
          id?: string
          notes?: string | null
          user_id: string
          xp_earned: number
        }
        Update: {
          activity_id?: string
          area?: Database["public"]["Enums"]["life_area"]
          completed_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      area_progress: {
        Row: {
          area: Database["public"]["Enums"]["life_area"]
          id: string
          level: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
          weekly_xp: number | null
        }
        Insert: {
          area: Database["public"]["Enums"]["life_area"]
          id?: string
          level?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
          weekly_xp?: number | null
        }
        Update: {
          area?: Database["public"]["Enums"]["life_area"]
          id?: string
          level?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "area_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed: boolean | null
          id: string
          joined_at: string | null
          progress: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          id?: string
          joined_at?: string | null
          progress?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          id?: string
          joined_at?: string | null
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          area: Database["public"]["Enums"]["life_area"] | null
          challenge_type: string
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string
          id: string
          name: string
          party_id: string | null
          start_date: string
          xp_reward: number
        }
        Insert: {
          area?: Database["public"]["Enums"]["life_area"] | null
          challenge_type: string
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          name: string
          party_id?: string | null
          start_date: string
          xp_reward: number
        }
        Update: {
          area?: Database["public"]["Enums"]["life_area"] | null
          challenge_type?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          party_id?: string | null
          start_date?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenges_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          created_at: string | null
          id: string
          leaderboard_type: string
          period: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          leaderboard_type: string
          period: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          leaderboard_type?: string
          period?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      parties: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "parties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      party_invitations: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string
          invited_user_id: string
          party_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by: string
          invited_user_id: string
          party_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string
          invited_user_id?: string
          party_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "party_invitations_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      party_members: {
        Row: {
          id: string
          joined_at: string | null
          party_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          party_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          party_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "party_members_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      predefined_activities: {
        Row: {
          area: Database["public"]["Enums"]["life_area"]
          created_at: string | null
          description: string | null
          frequency: string | null
          icon: string | null
          id: string
          name: string
          xp_value: number
        }
        Insert: {
          area: Database["public"]["Enums"]["life_area"]
          created_at?: string | null
          description?: string | null
          frequency?: string | null
          icon?: string | null
          id?: string
          name: string
          xp_value: number
        }
        Update: {
          area?: Database["public"]["Enums"]["life_area"]
          created_at?: string | null
          description?: string | null
          frequency?: string | null
          icon?: string | null
          id?: string
          name?: string
          xp_value?: number
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          allow_party_invites: boolean | null
          created_at: string | null
          id: string
          share_milestones: boolean | null
          show_on_leaderboards: boolean | null
          show_spiritual_progress: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_party_invites?: boolean | null
          created_at?: string | null
          id?: string
          share_milestones?: boolean | null
          show_on_leaderboards?: boolean | null
          show_spiritual_progress?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_party_invites?: boolean | null
          created_at?: string | null
          id?: string
          share_milestones?: boolean | null
          show_on_leaderboards?: boolean | null
          show_spiritual_progress?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          character_level: number | null
          character_name: string
          created_at: string | null
          id: string
          monthly_reset_date: string | null
          monthly_xp: number | null
          total_xp: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          character_level?: number | null
          character_name: string
          created_at?: string | null
          id: string
          monthly_reset_date?: string | null
          monthly_xp?: number | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          character_level?: number | null
          character_name?: string
          created_at?: string | null
          id?: string
          monthly_reset_date?: string | null
          monthly_xp?: number | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quests: {
        Row: {
          area: Database["public"]["Enums"]["life_area"]
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          is_completed: boolean | null
          quest_type: string
          title: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          area: Database["public"]["Enums"]["life_area"]
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          is_completed?: boolean | null
          quest_type: string
          title: string
          user_id: string
          xp_reward: number
        }
        Update: {
          area?: Database["public"]["Enums"]["life_area"]
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          is_completed?: boolean | null
          quest_type?: string
          title?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          area: Database["public"]["Enums"]["life_area"]
          current_count: number | null
          freeze_count: number | null
          id: string
          last_activity_date: string | null
          longest_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area: Database["public"]["Enums"]["life_area"]
          current_count?: number | null
          freeze_count?: number | null
          id?: string
          last_activity_date?: string | null
          longest_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area?: Database["public"]["Enums"]["life_area"]
          current_count?: number | null
          freeze_count?: number | null
          id?: string
          last_activity_date?: string | null
          longest_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      life_area:
        | "physical"
        | "mental"
        | "productivity"
        | "social"
        | "financial"
        | "personal"
        | "spiritual"
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
    Enums: {
      life_area: [
        "physical",
        "mental",
        "productivity",
        "social",
        "financial",
        "personal",
        "spiritual",
      ],
    },
  },
} as const
