// Auto-generated placeholder — run `supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts`
// after connecting Supabase. Replace this entire file with the generated output.

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
      manufacturers: {
        Row: {
          id: string
          name: string
          cluster: string
          city: string
          state: string
          whatsapp_phone: string
          login_email: string | null
          category: string
          gst_number: string | null
          bank_account: Json
          seller_score: number
          verified: boolean
          active: boolean
          payout_schedule: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          cluster: string
          city: string
          state: string
          whatsapp_phone: string
          login_email?: string | null
          category: string
          gst_number?: string | null
          bank_account?: Json
          seller_score?: number
          verified?: boolean
          active?: boolean
          payout_schedule?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          cluster?: string
          city?: string
          state?: string
          whatsapp_phone?: string
          login_email?: string | null
          category?: string
          gst_number?: string | null
          bank_account?: Json
          seller_score?: number
          verified?: boolean
          active?: boolean
          payout_schedule?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          manufacturer_id: string
          title: string
          title_hindi: string | null
          description: string | null
          price_paise: number
          mrp_paise: number | null
          images: string[]
          sizes: string[]
          colors: string[]
          category: string
          subcategory: string | null
          stock: number
          is_flash_deal: boolean
          flash_discount_pct: number | null
          flash_ends_at: string | null
          listing_quality_score: number
          active: boolean
          approval_status: string
          approval_note: string | null
          approval_reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          manufacturer_id: string
          title: string
          title_hindi?: string | null
          description?: string | null
          price_paise: number
          mrp_paise?: number | null
          images?: string[]
          sizes?: string[]
          colors?: string[]
          category: string
          subcategory?: string | null
          stock?: number
          is_flash_deal?: boolean
          flash_discount_pct?: number | null
          flash_ends_at?: string | null
          listing_quality_score?: number
          active?: boolean
          approval_status?: string
          approval_note?: string | null
          approval_reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          manufacturer_id?: string
          title?: string
          title_hindi?: string | null
          description?: string | null
          price_paise?: number
          mrp_paise?: number | null
          images?: string[]
          sizes?: string[]
          colors?: string[]
          category?: string
          subcategory?: string | null
          stock?: number
          is_flash_deal?: boolean
          flash_discount_pct?: number | null
          flash_ends_at?: string | null
          listing_quality_score?: number
          active?: boolean
          approval_status?: string
          approval_note?: string | null
          approval_reviewed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'products_manufacturer_id_fkey'; columns: ['manufacturer_id']; referencedRelation: 'manufacturers'; referencedColumns: ['id'] }
        ]
      }
      buyers: {
        Row: {
          id: string
          phone: string
          name: string | null
          default_pincode: string | null
          default_address: Json
          rto_count: number
          order_count: number
          is_blocked: boolean
          block_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          phone: string
          name?: string | null
          default_pincode?: string | null
          default_address?: Json
          rto_count?: number
          order_count?: number
          is_blocked?: boolean
          block_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          name?: string | null
          default_pincode?: string | null
          default_address?: Json
          rto_count?: number
          order_count?: number
          is_blocked?: boolean
          block_reason?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          product_id: string
          manufacturer_id: string
          buyer_phone: string
          buyer_name: string | null
          buyer_pincode: string
          buyer_address: string
          buyer_city: string | null
          buyer_state: string | null
          quantity: number
          size: string | null
          color: string | null
          amount_paise: number
          mrp_paise: number | null
          payment_method: string
          payment_status: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          cod_deposit_paid: boolean
          cod_deposit_amount: number
          shiprocket_order_id: string | null
          shiprocket_awb: string | null
          courier_name: string | null
          tracking_url: string | null
          rto_risk_score: number | null
          status: string
          cancelled_reason: string | null
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          manufacturer_id: string
          buyer_phone: string
          buyer_name?: string | null
          buyer_pincode: string
          buyer_address: string
          buyer_city?: string | null
          buyer_state?: string | null
          quantity?: number
          size?: string | null
          color?: string | null
          amount_paise: number
          mrp_paise?: number | null
          payment_method: string
          payment_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          cod_deposit_paid?: boolean
          cod_deposit_amount?: number
          shiprocket_order_id?: string | null
          shiprocket_awb?: string | null
          courier_name?: string | null
          tracking_url?: string | null
          rto_risk_score?: number | null
          status?: string
          cancelled_reason?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          manufacturer_id?: string
          buyer_phone?: string
          buyer_name?: string | null
          buyer_pincode?: string
          buyer_address?: string
          buyer_city?: string | null
          buyer_state?: string | null
          quantity?: number
          size?: string | null
          color?: string | null
          amount_paise?: number
          mrp_paise?: number | null
          payment_method?: string
          payment_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          cod_deposit_paid?: boolean
          cod_deposit_amount?: number
          shiprocket_order_id?: string | null
          shiprocket_awb?: string | null
          courier_name?: string | null
          tracking_url?: string | null
          rto_risk_score?: number | null
          status?: string
          cancelled_reason?: string | null
          delivered_at?: string | null
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'orders_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id'] },
          { foreignKeyName: 'orders_manufacturer_id_fkey'; columns: ['manufacturer_id']; referencedRelation: 'manufacturers'; referencedColumns: ['id'] }
        ]
      }
      order_events: {
        Row: {
          id: string
          order_id: string
          event_type: string
          description: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          event_type: string
          description?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          event_type?: string
          description?: string | null
          metadata?: Json
        }
        Relationships: [
          { foreignKeyName: 'order_events_order_id_fkey'; columns: ['order_id']; referencedRelation: 'orders'; referencedColumns: ['id'] }
        ]
      }
      returns: {
        Row: {
          id: string
          order_id: string
          reason: string
          description: string | null
          images: string[]
          status: string
          refund_amount: number | null
          refund_method: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          reason: string
          description?: string | null
          images?: string[]
          status?: string
          refund_amount?: number | null
          refund_method?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          reason?: string
          description?: string | null
          images?: string[]
          status?: string
          refund_amount?: number | null
          refund_method?: string | null
        }
        Relationships: [
          { foreignKeyName: 'returns_order_id_fkey'; columns: ['order_id']; referencedRelation: 'orders'; referencedColumns: ['id'] }
        ]
      }
      search_events: {
        Row: {
          id: string
          term: string
          term_normalised: string | null
          results_count: number
          buyer_pincode: string | null
          buyer_state: string | null
          clicked_product_id: string | null
          converted: boolean
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          term: string
          term_normalised?: string | null
          results_count?: number
          buyer_pincode?: string | null
          buyer_state?: string | null
          clicked_product_id?: string | null
          converted?: boolean
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          term?: string
          term_normalised?: string | null
          results_count?: number
          buyer_pincode?: string | null
          buyer_state?: string | null
          clicked_product_id?: string | null
          converted?: boolean
          session_id?: string | null
        }
        Relationships: []
      }
      manufacturer_alerts: {
        Row: {
          id: string
          manufacturer_id: string
          type: string
          title: string
          message: string
          recommended_action: string | null
          data_json: Json
          sent_whatsapp: boolean
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          manufacturer_id: string
          type: string
          title: string
          message: string
          recommended_action?: string | null
          data_json?: Json
          sent_whatsapp?: boolean
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          manufacturer_id?: string
          type?: string
          title?: string
          message?: string
          recommended_action?: string | null
          data_json?: Json
          sent_whatsapp?: boolean
          read?: boolean
        }
        Relationships: [
          { foreignKeyName: 'manufacturer_alerts_manufacturer_id_fkey'; columns: ['manufacturer_id']; referencedRelation: 'manufacturers'; referencedColumns: ['id'] }
        ]
      }
      payouts: {
        Row: {
          id: string
          manufacturer_id: string
          amount_paise: number
          status: string
          razorpay_payout_id: string | null
          orders_included: string[] | null
          notes: string | null
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          manufacturer_id: string
          amount_paise: number
          status?: string
          razorpay_payout_id?: string | null
          orders_included?: string[] | null
          notes?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          manufacturer_id?: string
          amount_paise?: number
          status?: string
          razorpay_payout_id?: string | null
          orders_included?: string[] | null
          notes?: string | null
          processed_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'payouts_manufacturer_id_fkey'; columns: ['manufacturer_id']; referencedRelation: 'manufacturers'; referencedColumns: ['id'] }
        ]
      }
      events: {
        Row: {
          id: string
          event_name: string
          session_id: string | null
          buyer_phone: string | null
          product_id: string | null
          manufacturer_id: string | null
          pincode: string | null
          state: string | null
          city: string | null
          device_type: string | null
          os: string | null
          properties: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_name: string
          session_id?: string | null
          buyer_phone?: string | null
          product_id?: string | null
          manufacturer_id?: string | null
          pincode?: string | null
          state?: string | null
          city?: string | null
          device_type?: string | null
          os?: string | null
          properties?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event_name?: string
          session_id?: string | null
          buyer_phone?: string | null
          product_id?: string | null
          manufacturer_id?: string | null
          pincode?: string | null
          state?: string | null
          city?: string | null
          device_type?: string | null
          os?: string | null
          properties?: Json
        }
        Relationships: []
      }
      daily_sku_metrics: {
        Row: {
          id: string
          date: string
          product_id: string
          manufacturer_id: string
          orders_count: number
          revenue_paise: number
          returns_count: number
          return_rate: number
          top_pincode: string | null
          top_city: string | null
        }
        Insert: {
          id?: string
          date: string
          product_id: string
          manufacturer_id: string
          orders_count?: number
          revenue_paise?: number
          returns_count?: number
          return_rate?: number
          top_pincode?: string | null
          top_city?: string | null
        }
        Update: {
          id?: string
          date?: string
          product_id?: string
          manufacturer_id?: string
          orders_count?: number
          revenue_paise?: number
          returns_count?: number
          return_rate?: number
          top_pincode?: string | null
          top_city?: string | null
        }
        Relationships: []
      }
      pincode_demand: {
        Row: {
          id: string
          week_start: string
          pincode: string
          state: string | null
          city: string | null
          district: string | null
          tier: number | null
          product_id: string | null
          manufacturer_id: string | null
          search_count: number
          order_count: number
          rto_count: number
          rto_rate: number
          avg_price_paise: number | null
        }
        Insert: {
          id?: string
          week_start: string
          pincode: string
          state?: string | null
          city?: string | null
          district?: string | null
          tier?: number | null
          product_id?: string | null
          manufacturer_id?: string | null
          search_count?: number
          order_count?: number
          rto_count?: number
          rto_rate?: number
          avg_price_paise?: number | null
        }
        Update: {
          id?: string
          week_start?: string
          pincode?: string
          state?: string | null
          city?: string | null
          district?: string | null
          tier?: number | null
          product_id?: string | null
          manufacturer_id?: string | null
          search_count?: number
          order_count?: number
          rto_count?: number
          rto_rate?: number
          avg_price_paise?: number | null
        }
        Relationships: []
      }
      search_trends: {
        Row: {
          id: string
          term: string
          category: string | null
          count_this_week: number
          count_last_week: number
          growth_pct: number
          zero_results: boolean
          top_pincodes: string[] | null
          updated_at: string
        }
        Insert: {
          id?: string
          term: string
          category?: string | null
          count_this_week?: number
          count_last_week?: number
          growth_pct?: number
          zero_results?: boolean
          top_pincodes?: string[] | null
          updated_at?: string
        }
        Update: {
          id?: string
          term?: string
          category?: string | null
          count_this_week?: number
          count_last_week?: number
          growth_pct?: number
          zero_results?: boolean
          top_pincodes?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          id: string
          manufacturer_id: string
          insight_type: string
          title: string
          content: string
          content_hindi: string | null
          data_snapshot: Json | null
          generated_at: string
          read: boolean
        }
        Insert: {
          id?: string
          manufacturer_id: string
          insight_type: string
          title: string
          content: string
          content_hindi?: string | null
          data_snapshot?: Json | null
          generated_at?: string
          read?: boolean
        }
        Update: {
          id?: string
          manufacturer_id?: string
          insight_type?: string
          title?: string
          content?: string
          content_hindi?: string | null
          data_snapshot?: Json | null
          generated_at?: string
          read?: boolean
        }
        Relationships: [
          { foreignKeyName: 'ai_insights_manufacturer_id_fkey'; columns: ['manufacturer_id']; referencedRelation: 'manufacturers'; referencedColumns: ['id'] }
        ]
      }
      ai_conversations: {
        Row: {
          id: string
          manufacturer_id: string
          messages: Json
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          manufacturer_id: string
          messages?: Json
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          manufacturer_id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'ai_conversations_manufacturer_id_fkey'; columns: ['manufacturer_id']; referencedRelation: 'manufacturers'; referencedColumns: ['id'] }
        ]
      }
      pincode_master: {
        Row: {
          pincode: string
          city: string | null
          district: string | null
          state: string | null
          region: string | null
          tier: number | null
          rto_risk: string
        }
        Insert: {
          pincode: string
          city?: string | null
          district?: string | null
          state?: string | null
          region?: string | null
          tier?: number | null
          rto_risk?: string
        }
        Update: {
          pincode?: string
          city?: string | null
          district?: string | null
          state?: string | null
          region?: string | null
          tier?: number | null
          rto_risk?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          id: string
          action: string
          target_type: string
          target_id: string | null
          old_value: Json | null
          new_value: Json | null
          performed_at: string
        }
        Insert: {
          id?: string
          action: string
          target_type: string
          target_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          performed_at?: string
        }
        Update: {
          id?: string
          action?: string
          target_type?: string
          target_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
        }
        Relationships: []
      }
      manufacturer_applications: {
        Row: {
          id: string
          business_name: string
          business_type: string
          gst_number: string | null
          pan_number: string
          registered_address: string
          city: string
          state: string
          pincode: string
          cluster: string
          contact_name: string
          contact_role: string
          phone: string
          whatsapp_phone: string
          email: string
          password_hash: string
          store_name: string
          category: string
          description: string | null
          monthly_capacity: number
          avg_price_paise: number
          payout_schedule: string
          shipping_from: string | null
          bank_account: Json
          status: string
          admin_note: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_name: string
          business_type: string
          gst_number?: string | null
          pan_number: string
          registered_address: string
          city: string
          state: string
          pincode: string
          cluster: string
          contact_name: string
          contact_role: string
          phone: string
          whatsapp_phone: string
          email: string
          password_hash: string
          store_name: string
          category: string
          description?: string | null
          monthly_capacity?: number
          avg_price_paise?: number
          payout_schedule?: string
          shipping_from?: string | null
          bank_account?: Json
          status?: string
          admin_note?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          business_type?: string
          gst_number?: string | null
          pan_number?: string
          registered_address?: string
          city?: string
          state?: string
          pincode?: string
          cluster?: string
          contact_name?: string
          contact_role?: string
          phone?: string
          whatsapp_phone?: string
          email?: string
          password_hash?: string
          store_name?: string
          category?: string
          description?: string | null
          monthly_capacity?: number
          avg_price_paise?: number
          payout_schedule?: string
          shipping_from?: string | null
          bank_account?: Json
          status?: string
          admin_note?: string | null
          reviewed_at?: string | null
        }
        Relationships: []
      }
      // ── Ads system tables (from migration 006_ads.sql) ─────────────
      ad_wallets: {
        Row: { manufacturer_id: string; balance_paise: number; total_topped_up: number; total_spent: number; updated_at: string }
        Insert: { manufacturer_id: string; balance_paise?: number; total_topped_up?: number; total_spent?: number; updated_at?: string }
        Update: { manufacturer_id?: string; balance_paise?: number; total_topped_up?: number; total_spent?: number; updated_at?: string }
        Relationships: []
      }
      ad_campaigns: {
        Row: {
          id: string; manufacturer_id: string; name: string; ad_type: string; product_id: string
          keywords: string[]; categories: string[]; flash_slot_date: string | null; flash_slot_time: string | null; flash_fee_paise: number | null
          max_bid_paise: number; daily_budget_paise: number; total_budget_paise: number; spent_today_paise: number; total_spent_paise: number
          start_date: string; end_date: string | null; review_status: string; reviewed_at: string | null; review_note: string | null
          reject_reason: string | null; auto_flags: string[]; auto_approved: boolean; status: string; quality_score: number
          total_impressions: number; total_clicks: number; total_conversions: number; total_revenue_paise: number
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; manufacturer_id: string; name: string; ad_type: string; product_id: string
          keywords?: string[]; categories?: string[]; flash_slot_date?: string | null; flash_slot_time?: string | null; flash_fee_paise?: number | null
          max_bid_paise: number; daily_budget_paise: number; total_budget_paise: number; spent_today_paise?: number; total_spent_paise?: number
          start_date?: string; end_date?: string | null; review_status?: string; reviewed_at?: string | null; review_note?: string | null
          reject_reason?: string | null; auto_flags?: string[]; auto_approved?: boolean; status?: string; quality_score?: number
          total_impressions?: number; total_clicks?: number; total_conversions?: number; total_revenue_paise?: number
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; manufacturer_id?: string; name?: string; ad_type?: string; product_id?: string
          keywords?: string[]; categories?: string[]; flash_slot_date?: string | null; flash_slot_time?: string | null; flash_fee_paise?: number | null
          max_bid_paise?: number; daily_budget_paise?: number; total_budget_paise?: number; spent_today_paise?: number; total_spent_paise?: number
          start_date?: string; end_date?: string | null; review_status?: string; reviewed_at?: string | null; review_note?: string | null
          reject_reason?: string | null; auto_flags?: string[]; auto_approved?: boolean; status?: string; quality_score?: number
          total_impressions?: number; total_clicks?: number; total_conversions?: number; total_revenue_paise?: number
          created_at?: string; updated_at?: string
        }
        Relationships: []
      }
      ad_impressions: {
        Row: {
          id: string; campaign_id: string; product_id: string; query: string | null; placement: string; position: number
          ad_score: number | null; actual_cpc_paise: number | null; quality_score: number | null; relevance_score: number | null; pctr: number | null
          buyer_pincode: string | null; buyer_session: string | null; buyer_ip_hash: string | null; created_at: string
        }
        Insert: {
          id?: string; campaign_id: string; product_id: string; query?: string | null; placement: string; position?: number
          ad_score?: number | null; actual_cpc_paise?: number | null; quality_score?: number | null; relevance_score?: number | null; pctr?: number | null
          buyer_pincode?: string | null; buyer_session?: string | null; buyer_ip_hash?: string | null; created_at?: string
        }
        Update: {
          id?: string; campaign_id?: string; product_id?: string; query?: string | null; placement?: string; position?: number
          ad_score?: number | null; actual_cpc_paise?: number | null; quality_score?: number | null; relevance_score?: number | null; pctr?: number | null
          buyer_pincode?: string | null; buyer_session?: string | null; buyer_ip_hash?: string | null; created_at?: string
        }
        Relationships: []
      }
      ad_clicks: {
        Row: {
          id: string; impression_id: string; campaign_id: string; product_id: string; manufacturer_id: string
          cpc_charged_paise: number; buyer_pincode: string | null; buyer_ip_hash: string | null; is_fraud: boolean; created_at: string
        }
        Insert: {
          id?: string; impression_id: string; campaign_id: string; product_id: string; manufacturer_id: string
          cpc_charged_paise: number; buyer_pincode?: string | null; buyer_ip_hash?: string | null; is_fraud?: boolean; created_at?: string
        }
        Update: {
          id?: string; impression_id?: string; campaign_id?: string; product_id?: string; manufacturer_id?: string
          cpc_charged_paise?: number; buyer_pincode?: string | null; buyer_ip_hash?: string | null; is_fraud?: boolean; created_at?: string
        }
        Relationships: []
      }
      ad_conversions: {
        Row: { id: string; click_id: string; campaign_id: string; order_id: string; revenue_paise: number; attributed_at: string }
        Insert: { id?: string; click_id: string; campaign_id: string; order_id: string; revenue_paise: number; attributed_at?: string }
        Update: { id?: string; click_id?: string; campaign_id?: string; order_id?: string; revenue_paise?: number; attributed_at?: string }
        Relationships: []
      }
      ad_quality_scores: {
        Row: {
          product_id: string; quality_score: number; return_rate_score: number | null; seller_score_norm: number | null
          listing_quality_score: number | null; review_rating_norm: number | null; fulfillment_speed_score: number | null
          override_score: number | null; override_reason: string | null; override_type: string | null
          override_expires_at: string | null; override_set_at: string | null; computed_at: string
        }
        Insert: {
          product_id: string; quality_score?: number; return_rate_score?: number | null; seller_score_norm?: number | null
          listing_quality_score?: number | null; review_rating_norm?: number | null; fulfillment_speed_score?: number | null
          override_score?: number | null; override_reason?: string | null; override_type?: string | null
          override_expires_at?: string | null; override_set_at?: string | null; computed_at?: string
        }
        Update: {
          product_id?: string; quality_score?: number; return_rate_score?: number | null; seller_score_norm?: number | null
          listing_quality_score?: number | null; review_rating_norm?: number | null; fulfillment_speed_score?: number | null
          override_score?: number | null; override_reason?: string | null; override_type?: string | null
          override_expires_at?: string | null; override_set_at?: string | null; computed_at?: string
        }
        Relationships: []
      }
      ad_wallet_transactions: {
        Row: {
          id: string; manufacturer_id: string; type: string; amount_paise: number
          campaign_id: string | null; click_id: string | null; description: string | null
          razorpay_payment_id: string | null; razorpay_order_id: string | null; buyer_pincode: string | null; created_at: string
        }
        Insert: {
          id?: string; manufacturer_id: string; type: string; amount_paise: number
          campaign_id?: string | null; click_id?: string | null; description?: string | null
          razorpay_payment_id?: string | null; razorpay_order_id?: string | null; buyer_pincode?: string | null; created_at?: string
        }
        Update: {
          id?: string; manufacturer_id?: string; type?: string; amount_paise?: number
          campaign_id?: string | null; click_id?: string | null; description?: string | null
          razorpay_payment_id?: string | null; razorpay_order_id?: string | null; buyer_pincode?: string | null; created_at?: string
        }
        Relationships: []
      }
      ad_review_log: {
        Row: { id: string; campaign_id: string; action: string; reason: string | null; note: string | null; reviewed_at: string }
        Insert: { id?: string; campaign_id: string; action: string; reason?: string | null; note?: string | null; reviewed_at?: string }
        Update: { id?: string; campaign_id?: string; action?: string; reason?: string | null; note?: string | null; reviewed_at?: string }
        Relationships: []
      }
      algorithm_config: {
        Row: {
          id: string; weight_bid: number; weight_quality: number; weight_relevance: number; weight_pctr: number
          qs_weight_return_rate: number; qs_weight_seller_score: number; qs_weight_listing: number; qs_weight_rating: number; qs_weight_fulfillment: number
          min_quality_score: number; min_relevance_score: number; min_bid_search_paise: number; min_bid_card_paise: number; min_bid_banner_cpm: number
          max_rto_pct: number; auto_approve_min_qs: number; auto_approve_max_rto: number; attribution_days: number
          fraud_cooldown_hours: number; max_clicks_per_ip_day: number; is_active: boolean; change_reason: string | null
          changed_by: string; effective_at: string; revert_at: string | null; created_at: string
        }
        Insert: {
          id?: string; weight_bid?: number; weight_quality?: number; weight_relevance?: number; weight_pctr?: number
          qs_weight_return_rate?: number; qs_weight_seller_score?: number; qs_weight_listing?: number; qs_weight_rating?: number; qs_weight_fulfillment?: number
          min_quality_score?: number; min_relevance_score?: number; min_bid_search_paise?: number; min_bid_card_paise?: number; min_bid_banner_cpm?: number
          max_rto_pct?: number; auto_approve_min_qs?: number; auto_approve_max_rto?: number; attribution_days?: number
          fraud_cooldown_hours?: number; max_clicks_per_ip_day?: number; is_active?: boolean; change_reason?: string | null
          changed_by?: string; effective_at?: string; revert_at?: string | null; created_at?: string
        }
        Update: {
          id?: string; weight_bid?: number; weight_quality?: number; weight_relevance?: number; weight_pctr?: number
          qs_weight_return_rate?: number; qs_weight_seller_score?: number; qs_weight_listing?: number; qs_weight_rating?: number; qs_weight_fulfillment?: number
          min_quality_score?: number; min_relevance_score?: number; min_bid_search_paise?: number; min_bid_card_paise?: number; min_bid_banner_cpm?: number
          max_rto_pct?: number; auto_approve_min_qs?: number; auto_approve_max_rto?: number; attribution_days?: number
          fraud_cooldown_hours?: number; max_clicks_per_ip_day?: number; is_active?: boolean; change_reason?: string | null
          changed_by?: string; effective_at?: string; revert_at?: string | null; created_at?: string
        }
        Relationships: []
      }
      algorithm_change_log: {
        Row: { id: string; config_id: string | null; field_name: string; old_value: string | null; new_value: string | null; change_reason: string | null; changed_by: string | null; changed_at: string }
        Insert: { id?: string; config_id?: string | null; field_name: string; old_value?: string | null; new_value?: string | null; change_reason?: string | null; changed_by?: string | null; changed_at?: string }
        Update: { id?: string; config_id?: string | null; field_name?: string; old_value?: string | null; new_value?: string | null; change_reason?: string | null; changed_by?: string | null; changed_at?: string }
        Relationships: []
      }
    }
    Views: {
      manufacturer_today_stats: {
        Row: {
          manufacturer_id: string
          orders_today: number
          revenue_today_paise: number
          returns_today: number
          return_rate: number
          total_stock: number
        }
        Relationships: []
      }
    }
    Functions: {
      refresh_manufacturer_stats: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      reset_daily_ad_spend: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      credit_ad_wallet: {
        Args: {
          p_manufacturer_id: string
          p_amount_paise: number
          p_razorpay_payment_id: string
          p_razorpay_order_id: string
        }
        Returns: void
      }
      deduct_ad_wallet: {
        Args: {
          p_manufacturer_id: string
          p_amount_paise: number
          p_campaign_id: string
          p_click_id: string
          p_buyer_pincode: string | null
        }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ── Ads system tables (added after migration 006_ads.sql) ──────────────────
// These extend the Database type with new tables not yet in generated types.
// Run `supabase gen types` after applying 006_ads.sql to replace this block.

export interface AdsDatabase {
  ad_wallets: {
    Row: {
      manufacturer_id: string
      balance_paise: number
      total_topped_up: number
      total_spent: number
      updated_at: string
    }
    Insert: {
      manufacturer_id: string
      balance_paise?: number
      total_topped_up?: number
      total_spent?: number
      updated_at?: string
    }
    Update: Partial<AdsDatabase['ad_wallets']['Insert']>
  }
  ad_campaigns: {
    Row: {
      id: string
      manufacturer_id: string
      name: string
      ad_type: string
      product_id: string
      keywords: string[]
      categories: string[]
      flash_slot_date: string | null
      flash_slot_time: string | null
      flash_fee_paise: number | null
      max_bid_paise: number
      daily_budget_paise: number
      total_budget_paise: number
      spent_today_paise: number
      total_spent_paise: number
      start_date: string
      end_date: string | null
      review_status: string
      reviewed_at: string | null
      review_note: string | null
      reject_reason: string | null
      auto_flags: string[]
      auto_approved: boolean
      status: string
      quality_score: number
      total_impressions: number
      total_clicks: number
      total_conversions: number
      total_revenue_paise: number
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      manufacturer_id: string
      name: string
      ad_type: string
      product_id: string
      keywords?: string[]
      categories?: string[]
      flash_slot_date?: string | null
      flash_slot_time?: string | null
      flash_fee_paise?: number | null
      max_bid_paise: number
      daily_budget_paise: number
      total_budget_paise: number
      spent_today_paise?: number
      total_spent_paise?: number
      start_date?: string
      end_date?: string | null
      review_status?: string
      reviewed_at?: string | null
      review_note?: string | null
      reject_reason?: string | null
      auto_flags?: string[]
      auto_approved?: boolean
      status?: string
      quality_score?: number
      total_impressions?: number
      total_clicks?: number
      total_conversions?: number
      total_revenue_paise?: number
      created_at?: string
      updated_at?: string
    }
    Update: Partial<AdsDatabase['ad_campaigns']['Insert']>
  }
  ad_impressions: {
    Row: {
      id: string
      campaign_id: string
      product_id: string
      query: string | null
      placement: string
      position: number
      ad_score: number | null
      actual_cpc_paise: number | null
      quality_score: number | null
      relevance_score: number | null
      pctr: number | null
      buyer_pincode: string | null
      buyer_session: string | null
      buyer_ip_hash: string | null
      created_at: string
    }
    Insert: {
      id?: string
      campaign_id: string
      product_id: string
      query?: string | null
      placement: string
      position?: number
      ad_score?: number | null
      actual_cpc_paise?: number | null
      quality_score?: number | null
      relevance_score?: number | null
      pctr?: number | null
      buyer_pincode?: string | null
      buyer_session?: string | null
      buyer_ip_hash?: string | null
      created_at?: string
    }
    Update: Partial<AdsDatabase['ad_impressions']['Insert']>
  }
  ad_clicks: {
    Row: {
      id: string
      impression_id: string
      campaign_id: string
      product_id: string
      manufacturer_id: string
      cpc_charged_paise: number
      buyer_pincode: string | null
      buyer_ip_hash: string | null
      is_fraud: boolean
      created_at: string
    }
    Insert: {
      id?: string
      impression_id: string
      campaign_id: string
      product_id: string
      manufacturer_id: string
      cpc_charged_paise: number
      buyer_pincode?: string | null
      buyer_ip_hash?: string | null
      is_fraud?: boolean
      created_at?: string
    }
    Update: Partial<AdsDatabase['ad_clicks']['Insert']>
  }
  ad_conversions: {
    Row: {
      id: string
      click_id: string
      campaign_id: string
      order_id: string
      revenue_paise: number
      attributed_at: string
    }
    Insert: {
      id?: string
      click_id: string
      campaign_id: string
      order_id: string
      revenue_paise: number
      attributed_at?: string
    }
    Update: Partial<AdsDatabase['ad_conversions']['Insert']>
  }
  ad_quality_scores: {
    Row: {
      product_id: string
      quality_score: number
      return_rate_score: number | null
      seller_score_norm: number | null
      listing_quality_score: number | null
      review_rating_norm: number | null
      fulfillment_speed_score: number | null
      override_score: number | null
      override_reason: string | null
      override_type: string | null
      override_expires_at: string | null
      override_set_at: string | null
      computed_at: string
    }
    Insert: {
      product_id: string
      quality_score?: number
      return_rate_score?: number | null
      seller_score_norm?: number | null
      listing_quality_score?: number | null
      review_rating_norm?: number | null
      fulfillment_speed_score?: number | null
      override_score?: number | null
      override_reason?: string | null
      override_type?: string | null
      override_expires_at?: string | null
      override_set_at?: string | null
      computed_at?: string
    }
    Update: Partial<AdsDatabase['ad_quality_scores']['Insert']>
  }
  ad_wallet_transactions: {
    Row: {
      id: string
      manufacturer_id: string
      type: string
      amount_paise: number
      campaign_id: string | null
      click_id: string | null
      description: string | null
      razorpay_payment_id: string | null
      razorpay_order_id: string | null
      buyer_pincode: string | null
      created_at: string
    }
    Insert: {
      id?: string
      manufacturer_id: string
      type: string
      amount_paise: number
      campaign_id?: string | null
      click_id?: string | null
      description?: string | null
      razorpay_payment_id?: string | null
      razorpay_order_id?: string | null
      buyer_pincode?: string | null
      created_at?: string
    }
    Update: Partial<AdsDatabase['ad_wallet_transactions']['Insert']>
  }
  ad_review_log: {
    Row: {
      id: string
      campaign_id: string
      action: string
      reason: string | null
      note: string | null
      reviewed_at: string
    }
    Insert: {
      id?: string
      campaign_id: string
      action: string
      reason?: string | null
      note?: string | null
      reviewed_at?: string
    }
    Update: Partial<AdsDatabase['ad_review_log']['Insert']>
  }
  algorithm_config: {
    Row: {
      id: string
      weight_bid: number
      weight_quality: number
      weight_relevance: number
      weight_pctr: number
      qs_weight_return_rate: number
      qs_weight_seller_score: number
      qs_weight_listing: number
      qs_weight_rating: number
      qs_weight_fulfillment: number
      min_quality_score: number
      min_relevance_score: number
      min_bid_search_paise: number
      min_bid_card_paise: number
      min_bid_banner_cpm: number
      max_rto_pct: number
      auto_approve_min_qs: number
      auto_approve_max_rto: number
      attribution_days: number
      fraud_cooldown_hours: number
      max_clicks_per_ip_day: number
      is_active: boolean
      change_reason: string | null
      changed_by: string
      effective_at: string
      revert_at: string | null
      created_at: string
    }
    Insert: {
      id?: string
      weight_bid?: number
      weight_quality?: number
      weight_relevance?: number
      weight_pctr?: number
      qs_weight_return_rate?: number
      qs_weight_seller_score?: number
      qs_weight_listing?: number
      qs_weight_rating?: number
      qs_weight_fulfillment?: number
      min_quality_score?: number
      min_relevance_score?: number
      min_bid_search_paise?: number
      min_bid_card_paise?: number
      min_bid_banner_cpm?: number
      max_rto_pct?: number
      auto_approve_min_qs?: number
      auto_approve_max_rto?: number
      attribution_days?: number
      fraud_cooldown_hours?: number
      max_clicks_per_ip_day?: number
      is_active?: boolean
      change_reason?: string | null
      changed_by?: string
      effective_at?: string
      revert_at?: string | null
      created_at?: string
    }
    Update: Partial<AdsDatabase['algorithm_config']['Insert']>
  }
  algorithm_change_log: {
    Row: {
      id: string
      config_id: string | null
      field_name: string
      old_value: string | null
      new_value: string | null
      change_reason: string | null
      changed_by: string | null
      changed_at: string
    }
    Insert: {
      id?: string
      config_id?: string | null
      field_name: string
      old_value?: string | null
      new_value?: string | null
      change_reason?: string | null
      changed_by?: string | null
      changed_at?: string
    }
    Update: Partial<AdsDatabase['algorithm_change_log']['Insert']>
  }
}
