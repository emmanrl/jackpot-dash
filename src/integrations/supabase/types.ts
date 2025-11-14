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
          achieved_at: string
          achievement_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      admin_wallet: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      bonus_settings: {
        Row: {
          bonus_type: string
          created_at: string
          description: string | null
          end_date: string | null
          fixed_amount: number | null
          id: string
          is_active: boolean
          percentage: number | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          bonus_type: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          percentage?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          bonus_type?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          percentage?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_login_rewards: {
        Row: {
          created_at: string
          id: string
          login_date: string
          streak_days: number
          user_id: string
          xp_awarded: number
        }
        Insert: {
          created_at?: string
          id?: string
          login_date?: string
          streak_days?: number
          user_id: string
          xp_awarded?: number
        }
        Update: {
          created_at?: string
          id?: string
          login_date?: string
          streak_days?: number
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      draws: {
        Row: {
          drawn_at: string
          id: string
          jackpot_id: string
          prize_amount: number
          total_tickets: number
          winning_ticket_id: string | null
        }
        Insert: {
          drawn_at?: string
          id?: string
          jackpot_id: string
          prize_amount: number
          total_tickets?: number
          winning_ticket_id?: string | null
        }
        Update: {
          drawn_at?: string
          id?: string
          jackpot_id?: string
          prize_amount?: number
          total_tickets?: number
          winning_ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draws_jackpot_id_fkey"
            columns: ["jackpot_id"]
            isOneToOne: false
            referencedRelation: "jackpots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_winning_ticket_id_fkey"
            columns: ["winning_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      jackpots: {
        Row: {
          background_image_url: string | null
          category: string | null
          created_at: string
          description: string | null
          draw_time: string | null
          expires_at: string | null
          frequency: string
          id: string
          jackpot_number: number | null
          name: string
          next_draw: string | null
          prize_pool: number
          status: Database["public"]["Enums"]["jackpot_status"]
          ticket_price: number
          updated_at: string
          winners_count: number
        }
        Insert: {
          background_image_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          draw_time?: string | null
          expires_at?: string | null
          frequency: string
          id?: string
          jackpot_number?: number | null
          name: string
          next_draw?: string | null
          prize_pool?: number
          status?: Database["public"]["Enums"]["jackpot_status"]
          ticket_price: number
          updated_at?: string
          winners_count?: number
        }
        Update: {
          background_image_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          draw_time?: string | null
          expires_at?: string | null
          frequency?: string
          id?: string
          jackpot_number?: number | null
          name?: string
          next_draw?: string | null
          prize_pool?: number
          status?: Database["public"]["Enums"]["jackpot_status"]
          ticket_price?: number
          updated_at?: string
          winners_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          api_key: string | null
          created_at: string
          id: string
          is_enabled: boolean
          merchant_id: string | null
          provider: string
          public_key: string | null
          secret_key: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          merchant_id?: string | null
          provider: string
          public_key?: string | null
          secret_key?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          merchant_id?: string | null
          provider?: string
          public_key?: string | null
          secret_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dark_mode: boolean | null
          email: string
          experience_points: number | null
          full_name: string | null
          id: string
          referral_code: string | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dark_mode?: boolean | null
          email: string
          experience_points?: number | null
          full_name?: string | null
          id: string
          referral_code?: string | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dark_mode?: boolean | null
          email?: string
          experience_points?: number | null
          full_name?: string | null
          id?: string
          referral_code?: string | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          total_commission: number
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          total_commission?: number
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          total_commission?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          email_from_address: string | null
          email_from_name: string | null
          faq: Json | null
          id: string
          privacy_policy: string | null
          resend_api_key: string | null
          site_logo_url: string | null
          site_name: string
          support_email: string | null
          terms_of_service: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          email_from_address?: string | null
          email_from_name?: string | null
          faq?: Json | null
          id?: string
          privacy_policy?: string | null
          resend_api_key?: string | null
          site_logo_url?: string | null
          site_name?: string
          support_email?: string | null
          terms_of_service?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          email_from_address?: string | null
          email_from_name?: string | null
          faq?: Json | null
          id?: string
          privacy_policy?: string | null
          resend_api_key?: string | null
          site_logo_url?: string | null
          site_name?: string
          support_email?: string | null
          terms_of_service?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      slider_images: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_active: boolean
          order_index: number
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          order_index?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          order_index?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          id: string
          jackpot_id: string
          purchase_price: number
          purchased_at: string
          ticket_number: string
          ticket_sequence: number | null
          user_id: string
        }
        Insert: {
          id?: string
          jackpot_id: string
          purchase_price: number
          purchased_at?: string
          ticket_number: string
          ticket_sequence?: number | null
          user_id: string
        }
        Update: {
          id?: string
          jackpot_id?: string
          purchase_price?: number
          purchased_at?: string
          ticket_number?: string
          ticket_sequence?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_jackpot_id_fkey"
            columns: ["jackpot_id"]
            isOneToOne: false
            referencedRelation: "jackpots"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          reference: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      winners: {
        Row: {
          claimed_at: string
          draw_id: string
          id: string
          jackpot_id: string
          prize_amount: number
          ticket_id: string
          total_participants: number | null
          total_pool_amount: number | null
          user_id: string
          winner_rank: number
        }
        Insert: {
          claimed_at?: string
          draw_id: string
          id?: string
          jackpot_id: string
          prize_amount: number
          ticket_id: string
          total_participants?: number | null
          total_pool_amount?: number | null
          user_id: string
          winner_rank?: number
        }
        Update: {
          claimed_at?: string
          draw_id?: string
          id?: string
          jackpot_id?: string
          prize_amount?: number
          ticket_id?: string
          total_participants?: number | null
          total_pool_amount?: number | null
          user_id?: string
          winner_rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "winners_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winners_jackpot_id_fkey"
            columns: ["jackpot_id"]
            isOneToOne: false
            referencedRelation: "jackpots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winners_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          created_at: string
          id: string
          is_default: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          created_at?: string
          id?: string
          is_default?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          id?: string
          is_default?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_activity_feed: {
        Row: {
          activity_data: Json | null
          activity_date: string | null
          activity_type: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_signup_bonus: { Args: { p_user_id: string }; Returns: undefined }
      award_experience_points: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      award_referral_commission: {
        Args: { p_prize_amount: number; p_winner_id: string }
        Returns: undefined
      }
      check_and_award_achievements: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      generate_referral_code: { Args: never; Returns: string }
      get_next_ticket_sequence: {
        Args: { p_jackpot_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_admin_wallet: { Args: { p_amount: number }; Returns: undefined }
      increment_wallet_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      notify_upcoming_draws: { Args: never; Returns: undefined }
      record_daily_login: { Args: { p_user_id: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
      jackpot_status: "active" | "drawing" | "completed" | "paused"
      transaction_status: "pending" | "approved" | "rejected" | "completed"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "ticket_purchase"
        | "prize_win"
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
      app_role: ["admin", "user"],
      jackpot_status: ["active", "drawing", "completed", "paused"],
      transaction_status: ["pending", "approved", "rejected", "completed"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "ticket_purchase",
        "prize_win",
      ],
    },
  },
} as const
