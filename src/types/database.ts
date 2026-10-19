// Generated from versioned migrations by scripts/generate-types.mjs. Do not edit.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          actor: string | null;
          entity: string;
          record_id: string | null;
          action: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor?: string | null;
          entity: string;
          record_id?: string | null;
          action: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          message: string;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          message: string;
          status?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
        Relationships: [];
      };
      catalog_items: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          category: string;
          description: string;
          image_url: string;
          alt_text: string | null;
          price: number | null;
          available: boolean;
          featured: boolean;
          sort_order: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          category: string;
          description?: string;
          image_url: string;
          alt_text?: string | null;
          price?: number | null;
          available?: boolean;
          featured?: boolean;
          sort_order?: number;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['catalog_items']['Insert']>;
        Relationships: [];
      };
      communication_logs: {
        Row: {
          id: string;
          customer_id: string | null;
          invoice_id: string | null;
          campaign_id: string | null;
          channel: string;
          status: string;
          provider_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          invoice_id?: string | null;
          campaign_id?: string | null;
          channel: string;
          status: string;
          provider_id?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['communication_logs']['Insert']>;
        Relationships: [];
      };
      content_revisions: {
        Row: {
          id: string;
          section_id: string;
          content: Json;
          actor: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          content: Json;
          actor?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['content_revisions']['Insert']>;
        Relationships: [];
      };
      credit_notes: {
        Row: {
          id: string;
          invoice_id: string;
          number: number;
          amount: number;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          number: number;
          amount: number;
          reason: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['credit_notes']['Insert']>;
        Relationships: [];
      };
      customer_addresses: {
        Row: {
          id: string;
          customer_id: string;
          label: string;
          address: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          label: string;
          address: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['customer_addresses']['Insert']>;
        Relationships: [];
      };
      customer_followups: {
        Row: {
          id: string;
          customer_id: string;
          name: string;
          due_at: string;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          name: string;
          due_at: string;
          status?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['customer_followups']['Insert']>;
        Relationships: [];
      };
      customer_notes: {
        Row: {
          id: string;
          customer_id: string;
          note: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          note: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['customer_notes']['Insert']>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          whatsapp: string | null;
          email: string | null;
          customer_type: string;
          billing_address: string | null;
          delivery_address: string | null;
          area: string | null;
          city: string | null;
          notes: string | null;
          marketing_consent: boolean;
          consent_at: string | null;
          consent_source: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          whatsapp?: string | null;
          email?: string | null;
          customer_type?: string;
          billing_address?: string | null;
          delivery_address?: string | null;
          area?: string | null;
          city?: string | null;
          notes?: string | null;
          marketing_consent?: boolean;
          consent_at?: string | null;
          consent_source?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
        Relationships: [];
      };
      delivery_record_items: {
        Row: {
          id: string;
          delivery_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
        };
        Insert: {
          id?: string;
          delivery_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
        };
        Update: Partial<Database['public']['Tables']['delivery_record_items']['Insert']>;
        Relationships: [];
      };
      delivery_records: {
        Row: {
          id: string;
          subscription_id: string;
          delivery_date: string;
          status: string;
          amount: number;
          assigned_to: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          delivery_date: string;
          status?: string;
          amount: number;
          assigned_to?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['delivery_records']['Insert']>;
        Relationships: [];
      };
      event_attachments: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          path: string;
          mime_type: string;
          bytes: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          path: string;
          mime_type: string;
          bytes: number;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['event_attachments']['Insert']>;
        Relationships: [];
      };
      event_expenses: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          category: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          category: string;
          amount: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['event_expenses']['Insert']>;
        Relationships: [];
      };
      event_materials: {
        Row: {
          id: string;
          event_id: string;
          item_id: string;
          quantity: number;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          item_id: string;
          quantity: number;
          status?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['event_materials']['Insert']>;
        Relationships: [];
      };
      event_tasks: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          assigned_to: string | null;
          status: string;
          due_date: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          assigned_to?: string | null;
          status?: string;
          due_date?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['event_tasks']['Insert']>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          customer_id: string;
          name: string;
          event_type: string | null;
          event_date: string;
          venue: string | null;
          guests: number | null;
          requirements: string | null;
          agreed_amount: number;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          name: string;
          event_type?: string | null;
          event_date: string;
          venue?: string | null;
          guests?: number | null;
          requirements?: string | null;
          agreed_amount?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
        Relationships: [];
      };
      faqs: {
        Row: {
          id: string;
          name: string;
          answer: string;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          answer: string;
          status?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['faqs']['Insert']>;
        Relationships: [];
      };
      flower_subscriptions: {
        Row: {
          id: string;
          customer_id: string;
          name: string;
          daily_amount: number;
          frequency: string;
          delivery_days: number[];
          start_date: string;
          end_date: string | null;
          status: string;
          address: string | null;
          notes: string | null;
          created_at: string;
          pricing_mode: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          name: string;
          daily_amount: number;
          frequency?: string;
          delivery_days?: number[];
          start_date: string;
          end_date?: string | null;
          status?: string;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          pricing_mode?: string;
        };
        Update: Partial<Database['public']['Tables']['flower_subscriptions']['Insert']>;
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          type: string;
          message: string;
          details: Json;
          marketing_consent: boolean;
          consent_at: string | null;
          status: string;
          customer_id: string | null;
          assigned_to: string | null;
          followup_at: string | null;
          notes: string | null;
          idempotency_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          type: string;
          message: string;
          details?: Json;
          marketing_consent?: boolean;
          consent_at?: string | null;
          status?: string;
          customer_id?: string | null;
          assigned_to?: string | null;
          followup_at?: string | null;
          notes?: string | null;
          idempotency_key: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['inquiries']['Insert']>;
        Relationships: [];
      };
      inquiry_limits: {
        Row: {
          key: string;
          window_start: string;
          hits: number;
        };
        Insert: {
          key: string;
          window_start: string;
          hits: number;
        };
        Update: Partial<Database['public']['Tables']['inquiry_limits']['Insert']>;
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          item_type: string;
          unit: string;
          reorder_threshold: number;
          unit_cost: number;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          item_type: string;
          unit: string;
          reorder_threshold?: number;
          unit_cost?: number;
          status?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['inventory_items']['Insert']>;
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          item_id: string;
          event_id: string | null;
          quantity: number;
          reason: string;
          notes: string | null;
          idempotency_key: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          item_id: string;
          event_id?: string | null;
          quantity: number;
          reason: string;
          notes?: string | null;
          idempotency_key: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['inventory_movements']['Insert']>;
        Relationships: [];
      };
      invoice_adjustments: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          amount: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          amount: number;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['invoice_adjustments']['Insert']>;
        Relationships: [];
      };
      invoice_balances: {
        Row: {
          id: string | null;
          total: number | null;
          credits: number | null;
          paid: number | null;
          balance: number | null;
        };
        Insert: {
          id?: string | null;
          total?: number | null;
          credits?: number | null;
          paid?: number | null;
          balance?: number | null;
        };
        Update: Partial<Database['public']['Tables']['invoice_balances']['Insert']>;
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          delivery_id: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          delivery_id?: string | null;
          description: string;
          quantity?: number;
          unit_price: number;
          amount: number;
        };
        Update: Partial<Database['public']['Tables']['invoice_items']['Insert']>;
        Relationships: [];
      };
      invoice_share_logs: {
        Row: {
          id: string;
          invoice_id: string;
          token_hash: string | null;
          expires_at: string | null;
          revoked_at: string | null;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          token_hash?: string | null;
          expires_at?: string | null;
          revoked_at?: string | null;
          status?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['invoice_share_logs']['Insert']>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          number: number;
          customer_id: string;
          subscription_id: string | null;
          event_id: string | null;
          period: string | null;
          status: string;
          due_date: string;
          total: number;
          snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          number: number;
          customer_id: string;
          subscription_id?: string | null;
          event_id?: string | null;
          period?: string | null;
          status?: string;
          due_date: string;
          total: number;
          snapshot?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
        Relationships: [];
      };
      marketing_consents: {
        Row: {
          id: string;
          customer_id: string;
          consented: boolean;
          source: string;
          recorded_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          consented: boolean;
          source: string;
          recorded_by?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['marketing_consents']['Insert']>;
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          name: string;
          path: string;
          public: boolean;
          mime_type: string;
          bytes: number;
          alt_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          path: string;
          public?: boolean;
          mime_type: string;
          bytes: number;
          alt_text?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['media_assets']['Insert']>;
        Relationships: [];
      };
      payment_links: {
        Row: {
          id: string;
          invoice_id: string;
          provider_link_id: string;
          url: string;
          amount: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          provider_link_id: string;
          url: string;
          amount: number;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payment_links']['Insert']>;
        Relationships: [];
      };
      payment_provider_events: {
        Row: {
          id: string;
          payload_hash: string;
          created_at: string;
        };
        Insert: {
          id: string;
          payload_hash: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payment_provider_events']['Insert']>;
        Relationships: [];
      };
      payment_refunds: {
        Row: {
          id: string;
          payment_id: string;
          provider_refund_id: string | null;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          provider_refund_id?: string | null;
          amount: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payment_refunds']['Insert']>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          amount: number;
          method: string;
          provider_payment_id: string | null;
          idempotency_key: string;
          reference: string | null;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          amount: number;
          method: string;
          provider_payment_id?: string | null;
          idempotency_key: string;
          reference?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
        Relationships: [];
      };
      portfolio_projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string;
          event_id: string | null;
          permission_confirmed: boolean;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url: string;
          event_id?: string | null;
          permission_confirmed?: boolean;
          status?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['portfolio_projects']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          role: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          role: string;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      public_site_sections: {
        Row: {
          key: string | null;
          published: Json | null;
          sort_order: number | null;
        };
        Insert: {
          key?: string | null;
          published?: Json | null;
          sort_order?: number | null;
        };
        Update: Partial<Database['public']['Tables']['public_site_sections']['Insert']>;
        Relationships: [];
      };
      public_site_settings: {
        Row: {
          public: Json | null;
        };
        Insert: {
          public?: Json | null;
        };
        Update: Partial<Database['public']['Tables']['public_site_settings']['Insert']>;
        Relationships: [];
      };
      quotation_items: {
        Row: {
          id: string;
          quotation_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
        };
        Insert: {
          id?: string;
          quotation_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
        };
        Update: Partial<Database['public']['Tables']['quotation_items']['Insert']>;
        Relationships: [];
      };
      quotations: {
        Row: {
          id: string;
          number: number;
          customer_id: string;
          event_id: string | null;
          name: string;
          status: string;
          valid_until: string;
          total: number;
          snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          number: number;
          customer_id: string;
          event_id?: string | null;
          name: string;
          status?: string;
          valid_until: string;
          total: number;
          snapshot: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['quotations']['Insert']>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string;
          image_url: string;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          image_url: string;
          status?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
        Relationships: [];
      };
      site_sections: {
        Row: {
          id: string;
          key: string;
          draft: Json;
          published: Json | null;
          published_at: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          draft?: Json;
          published?: Json | null;
          published_at?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['site_sections']['Insert']>;
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: number;
          public: Json;
          private: Json;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          public?: Json;
          private?: Json;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['site_settings']['Insert']>;
        Relationships: [];
      };
      social_posts: {
        Row: {
          id: string;
          name: string;
          image_url: string;
          alt_text: string;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          image_url: string;
          alt_text: string;
          status?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['social_posts']['Insert']>;
        Relationships: [];
      };
      subscription_items: {
        Row: {
          id: string;
          subscription_id: string;
          name: string;
          quantity: number;
          unit_price: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          name: string;
          quantity: number;
          unit_price: number;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['subscription_items']['Insert']>;
        Relationships: [];
      };
      subscription_pause_periods: {
        Row: {
          id: string;
          subscription_id: string;
          start_date: string;
          end_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscription_pause_periods']['Insert']>;
        Relationships: [];
      };
      subscription_price_changes: {
        Row: {
          id: string;
          subscription_id: string;
          effective_date: string;
          amount: number;
          reason: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          effective_date: string;
          amount: number;
          reason: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['subscription_price_changes']['Insert']>;
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          display_name: string;
          quote: string;
          permission_confirmed: boolean;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          display_name: string;
          quote: string;
          permission_confirmed?: boolean;
          status?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['testimonials']['Insert']>;
        Relationships: [];
      };
    };
  };
};
export type Row<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
