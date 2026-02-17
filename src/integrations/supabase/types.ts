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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_credentials: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          action_type: string
          applied_to: string
          condition_type: string
          condition_value: string
          created_at: string
          executions: number
          frequency: string
          id: string
          is_active: boolean
          last_execution: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          applied_to?: string
          condition_type: string
          condition_value: string
          created_at?: string
          executions?: number
          frequency: string
          id?: string
          is_active?: boolean
          last_execution?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          applied_to?: string
          condition_type?: string
          condition_value?: string
          created_at?: string
          executions?: number
          frequency?: string
          id?: string
          is_active?: boolean
          last_execution?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          layout: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meta_ad_accounts: {
        Row: {
          account_id: string
          account_status: number
          connection_id: string
          created_at: string
          currency: string | null
          id: string
          is_active: boolean
          name: string
          timezone_name: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          account_status?: number
          connection_id: string
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean
          name: string
          timezone_name?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          account_status?: number
          connection_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean
          name?: string
          timezone_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_ad_accounts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "meta_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          meta_user_email: string | null
          meta_user_id: string
          meta_user_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          meta_user_email?: string | null
          meta_user_id: string
          meta_user_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          meta_user_email?: string | null
          meta_user_id?: string
          meta_user_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pixel_meta_ids: {
        Row: {
          apelido: string | null
          created_at: string
          id: string
          meta_pixel_id: string
          pixel_id: string
          token: string | null
          user_id: string
        }
        Insert: {
          apelido?: string | null
          created_at?: string
          id?: string
          meta_pixel_id: string
          pixel_id: string
          token?: string | null
          user_id: string
        }
        Update: {
          apelido?: string | null
          created_at?: string
          id?: string
          meta_pixel_id?: string
          pixel_id?: string
          token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pixel_meta_ids_pixel_id_fkey"
            columns: ["pixel_id"]
            isOneToOne: false
            referencedRelation: "pixels"
            referencedColumns: ["id"]
          },
        ]
      }
      pixels: {
        Row: {
          add_to_cart_rule: string
          checkout_button_text: string | null
          checkout_detection_rule: string
          created_at: string
          id: string
          initiate_checkout_rule: string
          ip_config: string
          lead_rule: string
          name: string
          pixel_type: string
          purchase_product: string
          purchase_send_config: string
          purchase_value_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          add_to_cart_rule?: string
          checkout_button_text?: string | null
          checkout_detection_rule?: string
          created_at?: string
          id?: string
          initiate_checkout_rule?: string
          ip_config?: string
          lead_rule?: string
          name: string
          pixel_type?: string
          purchase_product?: string
          purchase_send_config?: string
          purchase_value_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          add_to_cart_rule?: string
          checkout_button_text?: string | null
          checkout_detection_rule?: string
          created_at?: string
          id?: string
          initiate_checkout_rule?: string
          ip_config?: string
          lead_rule?: string
          name?: string
          pixel_type?: string
          purchase_product?: string
          purchase_send_config?: string
          purchase_value_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_blocked: boolean | null
          phone: string | null
          plan: string | null
          plan_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          phone?: string | null
          plan?: string | null
          plan_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          phone?: string | null
          plan?: string | null
          plan_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rule_execution_logs: {
        Row: {
          action_description: string
          action_type: string
          campaign_name: string
          executed_at: string
          id: string
          rule_id: string
          rule_name: string
          user_id: string
        }
        Insert: {
          action_description: string
          action_type: string
          campaign_name: string
          executed_at?: string
          id?: string
          rule_id: string
          rule_name: string
          user_id: string
        }
        Update: {
          action_description?: string
          action_type?: string
          campaign_name?: string
          executed_at?: string
          id?: string
          rule_id?: string
          rule_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_execution_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount: number
          commission: number | null
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          payment_method: string | null
          platform: string
          product_id: string | null
          product_name: string | null
          raw_data: Json | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
          webhook_id: string | null
        }
        Insert: {
          amount?: number
          commission?: number | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          payment_method?: string | null
          platform: string
          product_id?: string | null
          product_name?: string | null
          raw_data?: Json | null
          status: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          webhook_id?: string | null
        }
        Update: {
          amount?: number
          commission?: number | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          payment_method?: string | null
          platform?: string
          product_id?: string | null
          product_name?: string | null
          raw_data?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
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
      webhooks: {
        Row: {
          client_id: string | null
          client_secret: string | null
          created_at: string
          id: string
          name: string
          pixel_id: string | null
          platform: string
          status: string
          token: string | null
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          name: string
          pixel_id?: string | null
          platform: string
          status?: string
          token?: string | null
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          name?: string
          pixel_id?: string | null
          platform?: string
          status?: string
          token?: string | null
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
