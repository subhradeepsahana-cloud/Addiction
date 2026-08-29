// Hand-written Supabase Database type mirroring supabase/migrations/*.sql.
// Row types are named interfaces (not indexed off Database) to avoid
// circular type references; Insert types derive from them with Omit.
// Regenerate with the Supabase CLI once a real project exists:
// `supabase gen types typescript --linked`.

type Table<Row, Insert, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export interface ProfileRow {
  id: string;
  display_name: string | null;
  age_range: string | null;
  timezone: string;
  units: 'metric' | 'imperial';
  currency: string;
  baseline_frequency_per_week: number | null;
  baseline_drinks_per_occasion: number | null;
  preferred_drink_categories: string[];
  typical_drinking_time: string | null;
  typical_social_context: string | null;
  common_situations: string[];
  average_drink_cost: number | null;
  onboarding_completed_at: string | null;
  tracking_start_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesRow {
  user_id: string;
  units: 'metric' | 'imperial';
  currency: string;
  average_drink_cost: number | null;
  timezone: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  trigger_alerts_enabled: boolean;
  motivational_notifications_enabled: boolean;
  checkin_reminders_enabled: boolean;
  notification_frequency: 'low' | 'normal' | 'high';
  location_enabled: boolean;
  calendar_enabled: boolean;
  ai_data_sharing_consent: boolean;
  emergency_country: string;
  created_at: string;
  updated_at: string;
}

export interface GoalRow {
  id: string;
  user_id: string;
  goal_type: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface MotivationRow {
  id: string;
  user_id: string;
  tag: string;
  custom_label: string | null;
  free_text: string | null;
  display_order: number;
  created_at: string;
}

export interface MotivationPhotoRow {
  id: string;
  user_id: string;
  motivation_id: string | null;
  storage_path: string;
  description: string;
  display_order: number;
  created_at: string;
}

export interface DrinkTypeRow {
  id: string;
  user_id: string | null;
  category: string;
  name: string;
  default_abv_percent: number;
  default_volume_ml: number;
  is_custom: boolean;
  created_at: string;
}

export interface DrinkingEventRow {
  id: string;
  user_id: string;
  occurred_at: string;
  drink_type_id: string | null;
  drink_category: string;
  drink_name: string;
  quantity: number;
  serving_size: string;
  volume_ml: number;
  abv_percent: number;
  standard_drinks: number;
  cost_estimate: number | null;
  context: string | null;
  mood: number | null;
  trigger: string | null;
  notes: string | null;
  was_planned: boolean | null;
  location_label: string | null;
  location_lat: number | null;
  location_lng: number | null;
  source: string;
  created_at: string;
}

export interface CravingRow {
  id: string;
  user_id: string;
  started_at: string;
  intensity_before: number;
  intensity_after: number | null;
  trigger: string | null;
  notes: string | null;
  outcome: string | null;
  interventions_used: string[];
  completed_at: string | null;
  created_at: string;
}

export interface CravingInterventionRow {
  id: string;
  craving_id: string;
  user_id: string;
  type: string;
  started_at: string;
  completed_at: string | null;
  marked_helpful: boolean | null;
  created_at: string;
}

export interface DailyCheckinRow {
  id: string;
  user_id: string;
  date: string;
  mood: number | null;
  stress: number | null;
  craving: number | null;
  sleep_hours: number | null;
  drank_alcohol: boolean | null;
  notes: string | null;
  created_at: string;
}

export interface UserTriggerRow {
  id: string;
  user_id: string;
  tag: string;
  source: string;
  created_at: string;
}

export interface ProtectivePatternRow {
  id: string;
  user_id: string;
  factors: string[];
  occurrences: number;
  alcohol_free_rate: number;
  confidence: string;
  computed_at: string;
}

export interface AiConversationRow {
  id: string;
  user_id: string;
  context: string;
  title: string | null;
  started_at: string;
  last_message_at: string;
  created_at: string;
}

export interface AiMessageRow {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string;
  content: string;
  tool_calls: unknown;
  safety_level: string | null;
  created_at: string;
}

export interface SafetyEventRow {
  id: string;
  user_id: string;
  level: string;
  category: string;
  matched_signals: string[];
  source_context: string;
  action_shown: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface HealthSourceRow {
  id: string;
  name: string;
  short_code: string;
  url: string;
  created_at: string;
}

export interface HealthArticleRow {
  id: string;
  source_id: string;
  topic: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  evidence_level: string;
  source_url: string;
  published_date: string | null;
  last_verified_date: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  scheduled_for: string | null;
  sent_at: string | null;
  opened_at: string | null;
  created_at: string;
}

export interface AchievementRow {
  id: string;
  user_id: string;
  type: string;
  achieved_at: string;
  metadata: unknown;
  created_at: string;
}

export interface AppErrorLogRow {
  id: string;
  user_id: string | null;
  scope: string;
  message: string;
  metadata: unknown;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, { id: string } & Partial<Omit<ProfileRow, 'id'>>>;
      user_preferences: Table<UserPreferencesRow, { user_id: string } & Partial<Omit<UserPreferencesRow, 'user_id'>>>;
      goals: Table<GoalRow, { user_id: string; goal_type: string; is_active?: boolean; notes?: string | null }>;
      motivations: Table<
        MotivationRow,
        { user_id: string; tag: string; custom_label?: string | null; free_text?: string | null; display_order?: number }
      >;
      motivation_photos: Table<
        MotivationPhotoRow,
        { user_id: string; motivation_id?: string | null; storage_path: string; description: string; display_order?: number }
      >;
      drink_types: Table<
        DrinkTypeRow,
        { user_id?: string | null; category: string; name: string; default_abv_percent: number; default_volume_ml: number; is_custom?: boolean }
      >;
      drinking_events: Table<DrinkingEventRow, Omit<DrinkingEventRow, 'id' | 'created_at'> & { id?: string }>;
      cravings: Table<CravingRow, Omit<CravingRow, 'id' | 'created_at'> & { id?: string }>;
      craving_interventions: Table<CravingInterventionRow, Omit<CravingInterventionRow, 'id' | 'created_at'> & { id?: string }>;
      daily_checkins: Table<DailyCheckinRow, Omit<DailyCheckinRow, 'id' | 'created_at'> & { id?: string }>;
      user_triggers: Table<UserTriggerRow, { user_id: string; tag: string; source?: string }>;
      protective_patterns: Table<ProtectivePatternRow, Omit<ProtectivePatternRow, 'id' | 'computed_at'>>;
      ai_conversations: Table<AiConversationRow, { user_id: string; context: string; title?: string | null }>;
      ai_messages: Table<AiMessageRow, Omit<AiMessageRow, 'id' | 'created_at'> & { id?: string }>;
      safety_events: Table<SafetyEventRow, Omit<SafetyEventRow, 'id' | 'created_at'> & { id?: string }>;
      health_sources: Table<HealthSourceRow, never>;
      health_articles: Table<HealthArticleRow, never>;
      notifications: Table<NotificationRow, Omit<NotificationRow, 'id' | 'created_at'> & { id?: string }>;
      achievements: Table<AchievementRow, { user_id: string; type: string; metadata?: unknown }>;
      app_error_logs: Table<AppErrorLogRow, { user_id?: string | null; scope: string; message: string; metadata?: unknown }>;
    };
    Views: {
      health_articles_freshness: {
        Row: { id: string; title: string; topic: string; last_verified_date: string; days_since_verified: number; needs_review: boolean };
        Relationships: [];
      };
    };
    Functions: {
      export_my_data: { Args: Record<string, never>; Returns: unknown };
    };
  };
}
