export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          base_currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          base_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          base_currency?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          symbol: string;
          name: string;
          type: string;
          module: string;
          exchange: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          name: string;
          type: string;
          module: string;
          exchange?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          name?: string;
          type?: string;
          module?: string;
          exchange?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      holdings: {
        Row: {
          id: string;
          portfolio_id: string;
          asset_id: string;
          quantity: number;
          avg_cost_basis: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          asset_id: string;
          quantity: number;
          avg_cost_basis: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          asset_id?: string;
          quantity?: number;
          avg_cost_basis?: number;
          notes?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          portfolio_id: string;
          asset_id: string;
          type: string;
          quantity: number;
          price: number;
          fees: number;
          currency: string;
          executed_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          asset_id: string;
          type: string;
          quantity: number;
          price: number;
          fees?: number;
          currency?: string;
          executed_at: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          asset_id?: string;
          type?: string;
          quantity?: number;
          price?: number;
          fees?: number;
          currency?: string;
          executed_at?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      price_cache: {
        Row: {
          id: string;
          asset_symbol: string;
          asset_type: string;
          date: string;
          open: number | null;
          high: number | null;
          low: number | null;
          close: number;
          volume: number | null;
          source: string;
          fetched_at: string;
        };
        Insert: {
          id?: string;
          asset_symbol: string;
          asset_type: string;
          date: string;
          open?: number | null;
          high?: number | null;
          low?: number | null;
          close: number;
          volume?: number | null;
          source: string;
        };
        Update: {
          asset_symbol?: string;
          asset_type?: string;
          date?: string;
          open?: number | null;
          high?: number | null;
          low?: number | null;
          close?: number;
          volume?: number | null;
          source?: string;
        };
        Relationships: [];
      };
      macro_indicators: {
        Row: {
          id: string;
          indicator_key: string;
          value: number;
          date: string;
          source: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          indicator_key: string;
          value: number;
          date: string;
          source: string;
          metadata?: Json;
        };
        Update: {
          indicator_key?: string;
          value?: number;
          date?: string;
          source?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      market_sentiment: {
        Row: {
          id: string;
          index_name: string;
          value: number;
          classification: string | null;
          date: string;
        };
        Insert: {
          id?: string;
          index_name: string;
          value: number;
          classification?: string | null;
          date: string;
        };
        Update: {
          index_name?: string;
          value?: number;
          classification?: string | null;
          date?: string;
        };
        Relationships: [];
      };
      asset_scores: {
        Row: {
          id: string;
          asset_id: string;
          overall_score: number;
          dimensions: Json;
          ai_analysis: string | null;
          ai_model: string | null;
          scored_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          overall_score: number;
          dimensions: Json;
          ai_analysis?: string | null;
          ai_model?: string | null;
        };
        Update: {
          asset_id?: string;
          overall_score?: number;
          dimensions?: Json;
          ai_analysis?: string | null;
          ai_model?: string | null;
        };
        Relationships: [];
      };
      opportunities: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          module: string;
          category: string | null;
          status: string;
          score: number | null;
          thesis: string | null;
          risks: string | null;
          target_price: number | null;
          stop_loss: number | null;
          ai_validation: Json | null;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          module: string;
          category?: string | null;
          status?: string;
          score?: number | null;
          thesis?: string | null;
          risks?: string | null;
          target_price?: number | null;
          stop_loss?: number | null;
          ai_validation?: Json | null;
          source?: string | null;
        };
        Update: {
          title?: string;
          module?: string;
          category?: string | null;
          status?: string;
          score?: number | null;
          thesis?: string | null;
          risks?: string | null;
          target_price?: number | null;
          stop_loss?: number | null;
          ai_validation?: Json | null;
          source?: string | null;
        };
        Relationships: [];
      };
      decision_journal: {
        Row: {
          id: string;
          user_id: string;
          asset_id: string | null;
          opportunity_id: string | null;
          action: string;
          reasoning: string;
          emotion: string | null;
          conviction: number | null;
          outcome: string | null;
          outcome_notes: string | null;
          decided_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          asset_id?: string | null;
          opportunity_id?: string | null;
          action: string;
          reasoning: string;
          emotion?: string | null;
          conviction?: number | null;
          outcome?: string | null;
          outcome_notes?: string | null;
          decided_at?: string;
        };
        Update: {
          asset_id?: string | null;
          opportunity_id?: string | null;
          action?: string;
          reasoning?: string;
          emotion?: string | null;
          conviction?: number | null;
          outcome?: string | null;
          outcome_notes?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          asset_id: string | null;
          indicator_key: string | null;
          condition: string;
          threshold: number;
          is_active: boolean;
          triggered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          asset_id?: string | null;
          indicator_key?: string | null;
          condition: string;
          threshold: number;
          is_active?: boolean;
        };
        Update: {
          asset_id?: string | null;
          indicator_key?: string | null;
          condition?: string;
          threshold?: number;
          is_active?: boolean;
          triggered_at?: string | null;
        };
        Relationships: [];
      };
      weekly_reports: {
        Row: {
          id: string;
          user_id: string;
          content: Json;
          highlights: Json | null;
          portfolio_snapshot: Json | null;
          week_start: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: Json;
          highlights?: Json | null;
          portfolio_snapshot?: Json | null;
          week_start: string;
        };
        Update: {
          content?: Json;
          highlights?: Json | null;
          portfolio_snapshot?: Json | null;
          week_start?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_portfolio_value: {
        Args: { p_portfolio_id: string };
        Returns: number;
      };
      get_portfolio_summary: {
        Args: { p_portfolio_id: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Specific type aliases for common usage
export type Portfolio = Tables<'portfolios'>;
export type Asset = Tables<'assets'>;
export type Holding = Tables<'holdings'>;
export type Transaction = Tables<'transactions'>;
export type PriceCache = Tables<'price_cache'>;
export type MacroIndicator = Tables<'macro_indicators'>;
export type MarketSentiment = Tables<'market_sentiment'>;
export type AssetScore = Tables<'asset_scores'>;
export type Opportunity = Tables<'opportunities'>;
export type DecisionJournalEntry = Tables<'decision_journal'>;
export type Alert = Tables<'alerts'>;
export type WeeklyReport = Tables<'weekly_reports'>;

// Asset type and module enums
export type AssetType = 'stock' | 'etf' | 'crypto' | 'commodity' | 'forex' | 'reit' | 'bond' | 'alternative' | 'business';
export type Module = 'equities' | 'crypto' | 'macro' | 'real_estate' | 'commodities' | 'forex' | 'alternative' | 'business';
export type TransactionType = 'buy' | 'sell' | 'dividend' | 'staking_reward' | 'interest' | 'fee';
export type OpportunityStatus = 'discovered' | 'researching' | 'validated' | 'watching' | 'invested' | 'exited' | 'rejected';
export type JournalAction = 'buy' | 'sell' | 'hold' | 'skip';
export type Emotion = 'calm' | 'excited' | 'fearful' | 'fomo' | 'confident';
export type AlertCondition = 'price_above' | 'price_below' | 'pct_change' | 'macro_threshold';
