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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_audit: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          detail: Json | null
          id: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          detail?: Json | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          detail?: Json | null
          id?: string
        }
        Relationships: []
      }
      allocation_templates: {
        Row: {
          created_at: string
          deleted_at: string | null
          household_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          household_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocation_templates_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          deleted_at: string | null
          household_id: string
          id: string
          month: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          deleted_at?: string | null
          household_id: string
          id?: string
          month: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          month?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          deleted_at: string | null
          household_id: string
          icon: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["entry_type"]
        }
        Insert: {
          color?: string | null
          deleted_at?: string | null
          household_id: string
          icon?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["entry_type"]
        }
        Update: {
          color?: string | null
          deleted_at?: string | null
          household_id?: string
          icon?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["entry_type"]
        }
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invites: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          household_id: string
          id: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          household_id: string
          id?: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          household_id?: string
          id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          household_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["household_role"]
          user_id: string
        }
        Insert: {
          household_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["household_role"]
          user_id: string
        }
        Update: {
          household_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["household_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      installment_plans: {
        Row: {
          category_id: string
          created_at: string
          day_of_month: number
          deleted_at: string | null
          household_id: string
          id: string
          installment_amount: number
          is_active: boolean
          name: string
          paid_installments: number
          payment_method_id: string | null
          start_date: string
          total_amount: number
          total_installments: number
        }
        Insert: {
          category_id: string
          created_at?: string
          day_of_month: number
          deleted_at?: string | null
          household_id: string
          id?: string
          installment_amount: number
          is_active?: boolean
          name: string
          paid_installments?: number
          payment_method_id?: string | null
          start_date: string
          total_amount: number
          total_installments: number
        }
        Update: {
          category_id?: string
          created_at?: string
          day_of_month?: number
          deleted_at?: string | null
          household_id?: string
          id?: string
          installment_amount?: number
          is_active?: boolean
          name?: string
          paid_installments?: number
          payment_method_id?: string | null
          start_date?: string
          total_amount?: number
          total_installments?: number
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_plans: {
        Row: {
          created_at: string
          deleted_at: string | null
          household_id: string
          id: string
          month: string
          note: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          household_id: string
          id?: string
          month: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          month?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_plans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          deleted_at: string | null
          household_id: string
          id: string
          name: string
        }
        Insert: {
          deleted_at?: string | null
          household_id: string
          id?: string
          name: string
        }
        Update: {
          deleted_at?: string | null
          household_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_allocations: {
        Row: {
          category_id: string | null
          created_at: string
          deleted_at: string | null
          household_id: string
          id: string
          is_paid: boolean
          label: string | null
          paid_transaction_id: string | null
          plan_id: string
          planned_amount: number
          recurring_id: string | null
          savings_goal_id: string | null
          sort_order: number
          week: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          household_id: string
          id?: string
          is_paid?: boolean
          label?: string | null
          paid_transaction_id?: string | null
          plan_id: string
          planned_amount: number
          recurring_id?: string | null
          savings_goal_id?: string | null
          sort_order?: number
          week?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          is_paid?: boolean
          label?: string | null
          paid_transaction_id?: string | null
          plan_id?: string
          planned_amount?: number
          recurring_id?: string | null
          savings_goal_id?: string | null
          sort_order?: number
          week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_allocations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_allocations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_allocations_paid_transaction_id_fkey"
            columns: ["paid_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_allocations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "monthly_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_allocations_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_allocations_savings_goal_id_fkey"
            columns: ["savings_goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_incomes: {
        Row: {
          amount: number
          created_at: string
          deleted_at: string | null
          household_id: string
          id: string
          is_confirmed: boolean
          label: string
          plan_id: string
          recurring_id: string | null
          sort_order: number
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          deleted_at?: string | null
          household_id: string
          id?: string
          is_confirmed?: boolean
          label: string
          plan_id: string
          recurring_id?: string | null
          sort_order?: number
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          is_confirmed?: boolean
          label?: string
          plan_id?: string
          recurring_id?: string | null
          sort_order?: number
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_incomes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_incomes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "monthly_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_incomes_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_incomes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          day_of_month: number
          deleted_at: string | null
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          household_id: string
          id: string
          is_active: boolean
          note: string | null
          payment_method_id: string | null
          type: Database["public"]["Enums"]["entry_type"]
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          day_of_month: number
          deleted_at?: string | null
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          household_id: string
          id?: string
          is_active?: boolean
          note?: string | null
          payment_method_id?: string | null
          type: Database["public"]["Enums"]["entry_type"]
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          day_of_month?: number
          deleted_at?: string | null
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          household_id?: string
          id?: string
          is_active?: boolean
          note?: string | null
          payment_method_id?: string | null
          type?: Database["public"]["Enums"]["entry_type"]
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string
          current_amount: number
          deadline: string | null
          deleted_at: string | null
          household_id: string
          id: string
          name: string
          target_amount: number
        }
        Insert: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          deleted_at?: string | null
          household_id: string
          id?: string
          name: string
          target_amount: number
        }
        Update: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          deleted_at?: string | null
          household_id?: string
          id?: string
          name?: string
          target_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          household_id: string | null
          id: string
          label: string | null
          role: Database["public"]["Enums"]["household_role"]
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          household_id?: string | null
          id?: string
          label?: string | null
          role?: Database["public"]["Enums"]["household_role"]
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          household_id?: string | null
          id?: string
          label?: string | null
          role?: Database["public"]["Enums"]["household_role"]
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signup_codes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      template_lines: {
        Row: {
          category_id: string | null
          created_at: string
          deleted_at: string | null
          household_id: string
          id: string
          label: string | null
          mode: Database["public"]["Enums"]["allocation_mode"]
          sort_order: number
          template_id: string
          value: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          household_id: string
          id?: string
          label?: string | null
          mode?: Database["public"]["Enums"]["allocation_mode"]
          sort_order?: number
          template_id: string
          value: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          label?: string | null
          mode?: Database["public"]["Enums"]["allocation_mode"]
          sort_order?: number
          template_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_lines_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_lines_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_lines_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "allocation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          date: string
          deleted_at: string | null
          household_id: string
          id: string
          note: string | null
          payment_method_id: string | null
          source: Database["public"]["Enums"]["transaction_source"]
          source_id: string | null
          type: Database["public"]["Enums"]["entry_type"]
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          date: string
          deleted_at?: string | null
          household_id: string
          id?: string
          note?: string | null
          payment_method_id?: string | null
          source?: Database["public"]["Enums"]["transaction_source"]
          source_id?: string | null
          type: Database["public"]["Enums"]["entry_type"]
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          date?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          note?: string | null
          payment_method_id?: string | null
          source?: Database["public"]["Enums"]["transaction_source"]
          source_id?: string | null
          type?: Database["public"]["Enums"]["entry_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_household: { Args: { p_name: string }; Returns: string }
      generate_due_installments: { Args: never; Returns: number }
      generate_due_recurring: { Args: never; Returns: number }
      is_household_member: { Args: { hid: string }; Returns: boolean }
      is_household_owner: { Args: { hid: string }; Returns: boolean }
      redeem_invite: { Args: { p_code: string }; Returns: string }
      shares_household: { Args: { other: string }; Returns: boolean }
    }
    Enums: {
      allocation_mode: "fixed" | "percent"
      entry_type: "income" | "expense"
      household_role: "owner" | "member"
      recurring_frequency: "monthly"
      transaction_source: "manual" | "recurring" | "installment" | "plan"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      allocation_mode: ["fixed", "percent"],
      entry_type: ["income", "expense"],
      household_role: ["owner", "member"],
      recurring_frequency: ["monthly"],
      transaction_source: ["manual", "recurring", "installment", "plan"],
    },
  },
} as const
