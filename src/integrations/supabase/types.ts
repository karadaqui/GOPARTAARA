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
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          internal_notes: string | null
          listing_id: string | null
          listings_deleted_count: number | null
          metadata: Json | null
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          internal_notes?: string | null
          listing_id?: string | null
          listings_deleted_count?: number | null
          metadata?: Json | null
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          internal_notes?: string | null
          listing_id?: string | null
          listings_deleted_count?: number | null
          metadata?: Json | null
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      blog_generations: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string | null
          content: string
          created_at: string
          id: string
          keywords: string[]
          meta_description: string
          preview: string
          published: boolean
          published_at: string
          read_time: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          category?: string | null
          content: string
          created_at?: string
          id?: string
          keywords?: string[]
          meta_description: string
          preview: string
          published?: boolean
          published_at?: string
          read_time?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          keywords?: string[]
          meta_description?: string
          preview?: string
          published?: boolean
          published_at?: string
          read_time?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      blog_topics: {
        Row: {
          created_at: string
          id: string
          last_used: string | null
          topic: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used?: string | null
          topic: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used?: string | null
          topic?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          resolved: boolean
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          resolved?: boolean
          subject?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          resolved?: boolean
          subject?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string | null
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id?: string | null
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "seller_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          confirmed: boolean
          confirmed_at: string | null
          created_at: string
          expires_at: string
          feedback: string | null
          id: string
          reason: string | null
          token: string
          type: string
          user_id: string
        }
        Insert: {
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          expires_at?: string
          feedback?: string | null
          id?: string
          reason?: string | null
          token?: string
          type?: string
          user_id: string
        }
        Update: {
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          expires_at?: string
          feedback?: string | null
          id?: string
          reason?: string | null
          token?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      listing_disputes: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          listing_id: string | null
          listing_title: string | null
          resolved_at: string | null
          review_id: string | null
          review_text: string | null
          seller_id: string
          seller_message: string
          status: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          listing_title?: string | null
          resolved_at?: string | null
          review_id?: string | null
          review_text?: string | null
          seller_id: string
          seller_message: string
          status?: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          listing_title?: string | null
          resolved_at?: string | null
          review_id?: string | null
          review_text?: string | null
          seller_id?: string
          seller_message?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_disputes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "seller_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_disputes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "listing_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_reviews: {
        Row: {
          comment: string | null
          created_at: string
          dispute_admin_note: string | null
          dispute_date: string | null
          dispute_reason: string | null
          dispute_status: string
          id: string
          listing_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          dispute_admin_note?: string | null
          dispute_date?: string | null
          dispute_reason?: string | null
          dispute_status?: string
          id?: string
          listing_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          dispute_admin_note?: string | null
          dispute_date?: string | null
          dispute_reason?: string | null
          dispute_status?: string
          id?: string
          listing_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "seller_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_saves: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_saves_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "seller_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_views: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "seller_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          message: string | null
          seller_id: string
          status: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          seller_id: string
          status?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "seller_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      part_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          part_query: string
          rating: number
          supplier: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          part_query: string
          rating: number
          supplier: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          part_query?: string
          rating?: number
          supplier?: string
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          active: boolean
          created_at: string
          current_price: number | null
          ebay_item_id: string | null
          email: string
          id: string
          image_url: string | null
          last_checked_at: string | null
          part_name: string
          supplier: string | null
          target_price: number
          triggered: boolean
          triggered_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          current_price?: number | null
          ebay_item_id?: string | null
          email: string
          id?: string
          image_url?: string | null
          last_checked_at?: string | null
          part_name: string
          supplier?: string | null
          target_price: number
          triggered?: boolean
          triggered_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          current_price?: number | null
          ebay_item_id?: string | null
          email?: string
          id?: string
          image_url?: string | null
          last_checked_at?: string | null
          part_name?: string
          supplier?: string | null
          target_price?: number
          triggered?: boolean
          triggered_at?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          checked_at: string
          id: string
          item_id: string
          price: number
        }
        Insert: {
          checked_at?: string
          id?: string
          item_id: string
          price: number
        }
        Update: {
          checked_at?: string
          id?: string
          item_id?: string
          price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bonus_searches: number
          created_at: string
          display_name: string | null
          email: string | null
          first_payment_date: string | null
          id: string
          promo_code_used: string | null
          referral_code: string
          refund_date: string | null
          refund_granted: boolean
          seller_bank_details: Json | null
          subscription_period: string
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bonus_searches?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_payment_date?: string | null
          id?: string
          promo_code_used?: string | null
          referral_code?: string
          refund_date?: string | null
          refund_granted?: boolean
          seller_bank_details?: Json | null
          subscription_period?: string
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bonus_searches?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_payment_date?: string | null
          id?: string
          promo_code_used?: string | null
          referral_code?: string
          refund_date?: string | null
          refund_granted?: boolean
          seller_bank_details?: Json | null
          subscription_period?: string
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          function_name: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          function_name: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          function_name?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      saved_folders: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_parts: {
        Row: {
          created_at: string
          currency: string | null
          folder_id: string | null
          id: string
          image_url: string | null
          part_name: string
          part_number: string | null
          price: number | null
          supplier: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          folder_id?: string | null
          id?: string
          image_url?: string | null
          part_name: string
          part_number?: string | null
          price?: number | null
          supplier?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          folder_id?: string | null
          id?: string
          image_url?: string | null
          part_name?: string
          part_number?: string | null
          price?: number | null
          supplier?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_parts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "saved_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          query: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          query?: string
          user_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          function_name: string | null
          id: string
          ip_address: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          function_name?: string | null
          id?: string
          ip_address?: string | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          function_name?: string | null
          id?: string
          ip_address?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      seller_applications: {
        Row: {
          business_address: string | null
          business_name: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          id: string
          parts_description: string
          status: string
          tier: string
          user_id: string | null
        }
        Insert: {
          business_address?: string | null
          business_name: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          parts_description: string
          status?: string
          tier?: string
          user_id?: string | null
        }
        Update: {
          business_address?: string | null
          business_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          parts_description?: string
          status?: string
          tier?: string
          user_id?: string | null
        }
        Relationships: []
      }
      seller_listings: {
        Row: {
          active: boolean
          approval_status: string
          boost_package: string | null
          category: string | null
          compatible_vehicles: string[]
          created_at: string
          currency: string
          description: string
          external_link: string | null
          featured: boolean
          featured_until: string | null
          id: string
          photos: string[]
          price: number | null
          save_count: number
          seller_id: string
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          active?: boolean
          approval_status?: string
          boost_package?: string | null
          category?: string | null
          compatible_vehicles?: string[]
          created_at?: string
          currency?: string
          description?: string
          external_link?: string | null
          featured?: boolean
          featured_until?: string | null
          id?: string
          photos?: string[]
          price?: number | null
          save_count?: number
          seller_id: string
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          active?: boolean
          approval_status?: string
          boost_package?: string | null
          category?: string | null
          compatible_vehicles?: string[]
          created_at?: string
          currency?: string
          description?: string
          external_link?: string | null
          featured?: boolean
          featured_until?: string | null
          id?: string
          photos?: string[]
          price?: number | null
          save_count?: number
          seller_id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "seller_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          approved: boolean
          business_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          seller_tier: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          approved?: boolean
          business_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          seller_tier?: string
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          approved?: boolean
          business_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          seller_tier?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_vehicles: {
        Row: {
          created_at: string
          engine_size: string | null
          id: string
          make: string
          model: string
          mot_expiry_date: string | null
          nickname: string | null
          registration_number: string | null
          tax_expiry_date: string | null
          user_id: string
          vin: string | null
          year: number
        }
        Insert: {
          created_at?: string
          engine_size?: string | null
          id?: string
          make: string
          model: string
          mot_expiry_date?: string | null
          nickname?: string | null
          registration_number?: string | null
          tax_expiry_date?: string | null
          user_id: string
          vin?: string | null
          year: number
        }
        Update: {
          created_at?: string
          engine_size?: string | null
          id?: string
          make?: string
          model?: string
          mot_expiry_date?: string | null
          nickname?: string | null
          registration_number?: string | null
          tax_expiry_date?: string | null
          user_id?: string
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
      vehicle_notes: {
        Row: {
          created_at: string
          id: string
          note: string
          noted_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note: string
          noted_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          noted_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_notes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "user_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_rate_limits: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      increment_listing_view: {
        Args: { p_listing_id: string; p_viewer_id?: string }
        Returns: undefined
      }
      is_email_confirmed: { Args: { p_email: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      process_referral: {
        Args: { new_user_id: string; referrer_code: string }
        Returns: boolean
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      subscription_plan:
        | "free"
        | "pro"
        | "business"
        | "basic_seller"
        | "featured_seller"
        | "pro_seller"
        | "admin"
        | "elite"
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
      subscription_plan: [
        "free",
        "pro",
        "business",
        "basic_seller",
        "featured_seller",
        "pro_seller",
        "admin",
        "elite",
      ],
    },
  },
} as const
