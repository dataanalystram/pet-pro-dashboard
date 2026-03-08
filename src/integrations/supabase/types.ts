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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      booking_requests: {
        Row: {
          assigned_staff_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          decline_reason: string | null
          estimated_price: number | null
          id: string
          is_urgent: boolean
          notes: string | null
          pet_name: string | null
          pet_species: string | null
          pets: Json
          preferred_date: string | null
          preferred_time: string | null
          response_message: string | null
          service_id: string | null
          service_name: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_staff_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          decline_reason?: string | null
          estimated_price?: number | null
          id?: string
          is_urgent?: boolean
          notes?: string | null
          pet_name?: string | null
          pet_species?: string | null
          pets?: Json
          preferred_date?: string | null
          preferred_time?: string | null
          response_message?: string | null
          service_id?: string | null
          service_name: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_staff_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          decline_reason?: string | null
          estimated_price?: number | null
          id?: string
          is_urgent?: boolean
          notes?: string | null
          pet_name?: string | null
          pet_species?: string | null
          pets?: Json
          preferred_date?: string | null
          preferred_time?: string | null
          response_message?: string | null
          service_id?: string | null
          service_name?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          assigned_staff_id: string | null
          booking_date: string
          created_at: string
          customer_email: string | null
          customer_name: string
          id: string
          pet_breed: string | null
          pet_name: string
          pet_species: string | null
          service_name: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          assigned_staff_id?: string | null
          booking_date: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          id?: string
          pet_breed?: string | null
          pet_name: string
          pet_species?: string | null
          service_name: string
          start_time: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Update: {
          assigned_staff_id?: string | null
          booking_date?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          id?: string
          pet_breed?: string | null
          pet_name?: string
          pet_species?: string | null
          service_name?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          max_redemptions: number | null
          name: string
          promo_code: string | null
          redemptions: number
          start_date: string | null
          status: string
          target_audience: string
          type: string
          updated_at: string
          views: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          max_redemptions?: number | null
          name: string
          promo_code?: string | null
          redemptions?: number
          start_date?: string | null
          status?: string
          target_audience?: string
          type: string
          updated_at?: string
          views?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          max_redemptions?: number | null
          name?: string
          promo_code?: string | null
          redemptions?: number
          start_date?: string | null
          status?: string
          target_audience?: string
          type?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          first_booking_date: string | null
          id: string
          last_booking_date: string | null
          pets: string[]
          tier: string
          total_bookings: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          first_booking_date?: string | null
          id?: string
          last_booking_date?: string | null
          pets?: string[]
          tier?: string
          total_bookings?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          first_booking_date?: string | null
          id?: string
          last_booking_date?: string | null
          pets?: string[]
          tier?: string
          total_bookings?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          brand: string | null
          category: string
          cost_per_unit: number
          created_at: string
          description: string | null
          featured: boolean
          id: string
          images: string[]
          name: string
          quantity_in_stock: number
          reorder_point: number
          retail_price: number | null
          short_description: string | null
          sku: string | null
          status: string
          supplier_name: string | null
          tags: string[]
          total_sold: number
          updated_at: string
          variants: Json
          video_url: string | null
          weight_grams: number | null
        }
        Insert: {
          brand?: string | null
          category: string
          cost_per_unit?: number
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          name: string
          quantity_in_stock?: number
          reorder_point?: number
          retail_price?: number | null
          short_description?: string | null
          sku?: string | null
          status?: string
          supplier_name?: string | null
          tags?: string[]
          total_sold?: number
          updated_at?: string
          variants?: Json
          video_url?: string | null
          weight_grams?: number | null
        }
        Update: {
          brand?: string | null
          category?: string
          cost_per_unit?: number
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          name?: string
          quantity_in_stock?: number
          reorder_point?: number
          retail_price?: number | null
          short_description?: string | null
          sku?: string | null
          status?: string
          supplier_name?: string | null
          tags?: string[]
          total_sold?: number
          updated_at?: string
          variants?: Json
          video_url?: string | null
          weight_grams?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          customer_email: string
          customer_name: string
          id: string
          sender: string
        }
        Insert: {
          content: string
          created_at?: string
          customer_email: string
          customer_name: string
          id?: string
          sender?: string
        }
        Update: {
          content?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          id?: string
          sender?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          discount: number
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          shipping_address: Json | null
          status: string
          subtotal: number
          tax: number
          total: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_response: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          id: string
          pet_name: string | null
          pet_species: string | null
          rating: number
          responded_at: string | null
          review_text: string | null
          service_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          id?: string
          pet_name?: string | null
          pet_species?: string | null
          rating: number
          responded_at?: string | null
          review_text?: string | null
          service_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          id?: string
          pet_name?: string | null
          pet_species?: string | null
          rating?: number
          responded_at?: string | null
          review_text?: string | null
          service_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_staff: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          price_override: number | null
          service_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          price_override?: number | null
          service_id: string
          staff_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          price_override?: number | null
          service_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_staff_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          aftercare_notes: string | null
          age_restrictions: string | null
          available_days: string[]
          available_time_end: string
          available_time_start: string
          base_price: number
          breed_restrictions: string[]
          buffer_minutes: number
          cancellation_policy: string | null
          category: string
          cover_image_url: string | null
          created_at: string
          currency: string
          custom_category: string | null
          custom_pet_types: string[]
          deposit_amount: number | null
          deposit_required: boolean
          deposit_type: string
          description: string | null
          difficulty_level: string
          display_order: number
          duration_minutes: number
          faq: Json
          featured: boolean
          gallery_urls: string[]
          group_discount_percent: number
          highlights: string[]
          id: string
          is_active: boolean
          long_description: string | null
          max_bookings_per_day: number
          min_advance_hours: number
          name: string
          pet_size_pricing: Json | null
          pet_types_accepted: string[]
          preparation_notes: string | null
          price_from: number | null
          price_type: string
          recommended_services: string[]
          service_addons: Json
          service_area_km: number | null
          service_location: string
          short_description: string | null
          tags: string[]
          tax_inclusive: boolean
          tax_rate: number
          terms_conditions: string | null
          total_bookings: number
          updated_at: string
          vaccination_required: boolean
          weight_limit_kg: number | null
        }
        Insert: {
          aftercare_notes?: string | null
          age_restrictions?: string | null
          available_days?: string[]
          available_time_end?: string
          available_time_start?: string
          base_price: number
          breed_restrictions?: string[]
          buffer_minutes?: number
          cancellation_policy?: string | null
          category: string
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          custom_category?: string | null
          custom_pet_types?: string[]
          deposit_amount?: number | null
          deposit_required?: boolean
          deposit_type?: string
          description?: string | null
          difficulty_level?: string
          display_order?: number
          duration_minutes: number
          faq?: Json
          featured?: boolean
          gallery_urls?: string[]
          group_discount_percent?: number
          highlights?: string[]
          id?: string
          is_active?: boolean
          long_description?: string | null
          max_bookings_per_day?: number
          min_advance_hours?: number
          name: string
          pet_size_pricing?: Json | null
          pet_types_accepted?: string[]
          preparation_notes?: string | null
          price_from?: number | null
          price_type?: string
          recommended_services?: string[]
          service_addons?: Json
          service_area_km?: number | null
          service_location?: string
          short_description?: string | null
          tags?: string[]
          tax_inclusive?: boolean
          tax_rate?: number
          terms_conditions?: string | null
          total_bookings?: number
          updated_at?: string
          vaccination_required?: boolean
          weight_limit_kg?: number | null
        }
        Update: {
          aftercare_notes?: string | null
          age_restrictions?: string | null
          available_days?: string[]
          available_time_end?: string
          available_time_start?: string
          base_price?: number
          breed_restrictions?: string[]
          buffer_minutes?: number
          cancellation_policy?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          custom_category?: string | null
          custom_pet_types?: string[]
          deposit_amount?: number | null
          deposit_required?: boolean
          deposit_type?: string
          description?: string | null
          difficulty_level?: string
          display_order?: number
          duration_minutes?: number
          faq?: Json
          featured?: boolean
          gallery_urls?: string[]
          group_discount_percent?: number
          highlights?: string[]
          id?: string
          is_active?: boolean
          long_description?: string | null
          max_bookings_per_day?: number
          min_advance_hours?: number
          name?: string
          pet_size_pricing?: Json | null
          pet_types_accepted?: string[]
          preparation_notes?: string | null
          price_from?: number | null
          price_type?: string
          recommended_services?: string[]
          service_addons?: Json
          service_area_km?: number | null
          service_location?: string
          short_description?: string | null
          tags?: string[]
          tax_inclusive?: boolean
          tax_rate?: number
          terms_conditions?: string | null
          total_bookings?: number
          updated_at?: string
          vaccination_required?: boolean
          weight_limit_kg?: number | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          avatar_url: string | null
          average_rating: number
          bio: string | null
          created_at: string
          email: string
          full_name: string
          hire_date: string | null
          hourly_rate: number | null
          id: string
          max_daily_bookings: number
          phone: string | null
          role: string
          specializations: string[]
          status: string
          title: string | null
          total_services_completed: number
          updated_at: string
          working_hours: Json
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          max_daily_bookings?: number
          phone?: string | null
          role?: string
          specializations?: string[]
          status?: string
          title?: string | null
          total_services_completed?: number
          updated_at?: string
          working_hours?: Json
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          max_daily_bookings?: number
          phone?: string | null
          role?: string
          specializations?: string[]
          status?: string
          title?: string | null
          total_services_completed?: number
          updated_at?: string
          working_hours?: Json
        }
        Relationships: []
      }
      staff_time_off: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string | null
          staff_id: string
          start_date: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason?: string | null
          staff_id: string
          start_date: string
          status?: string
          type?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string | null
          staff_id?: string
          start_date?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_off_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
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
