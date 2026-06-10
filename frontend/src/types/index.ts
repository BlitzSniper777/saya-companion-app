// Backend API types matching the Pydantic models

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  language: string;
  timezone: string;
  user_preferences: Record<string, any>;
  onboarding_completed: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface Companion {
  id: string;
  user_id: string;
  name: string;
  personality_calibration: Record<string, any>;
  mode: "friend" | "therapist" | "life_coach" | "romantic_partner" | "custom" | "adult";
  relationship_length_days: number;
  relationship_stage: string;
  language: string;
  companion_birthday: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  summary: string | null;
  last_message_at: string;
  created_at: string;
  message_count?: number;
  last_message_preview?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  emotion_tags: string[];
  topic_tags: string[];
  token_count: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: "free" | "companion" | "gfbf" | "adult";
  status: "active" | "cancelled" | "past_due" | "trialing";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  daily_message_count: number;
  daily_message_limit: number;
  daily_message_reset_at: string;
  current_period_end: string | null;
  voice_credits: number;
  streak_count: number;
  last_chat_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanInfo {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  price_lifetime: number | null;
  features: string[];
  message_limit: number | null;
  memory_days: number | null;
  modes: string[];
  voice_calls?: boolean;
  adult_content?: boolean;
}

export interface CrisisEvent {
  id: string;
  user_id: string | null;
  message_content: string;
  severity: "low" | "medium" | "high" | "critical";
  resources_shown: string[];
  admin_reviewed: boolean;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  event_data: Record<string, any>;
  session_id: string | null;
  created_at: string;
}

// API Request/Response types
export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface OnboardingRequest {
  q1_what_brings_you: string;
  q2_communication_style: string;
  q3_friendship_values: string;
  q4_faith_spirituality: string;
  q5_user_name: string;
  companion_name?: string;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  user: User;
  companion: Companion;
}

export interface ChatRequest {
  conversation_id: string;
  message: string;
}

export interface ChatChunk {
  type: "chunk" | "complete" | "crisis" | "error";
  content?: string;
  message_id?: string;
  conversation_id?: string;
  resources?: Array<{ name: string; contact: string; url: string }>;
  error?: string;
}

export interface CheckoutRequest {
  plan: "companion" | "gfbf" | "adult";
  interval: "monthly" | "yearly" | "lifetime";
  success_url?: string;
  cancel_url?: string;
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface PortalRequest {
  return_url?: string;
}

export interface PortalResponse {
  portal_url: string;
}

// Admin types
export interface AdminStats {
  total_users: number;
  active_today: number;
  messages_today: number;
  mrr: number;
  subscriptions_by_plan: Record<string, number>;
}

export interface AdminAnalytics {
  dau: Array<{ date: string; count: number }>;
  wau: Array<{ week_start: string; count: number }>;
  mau: Array<{ month: string; count: number }>;
  messages_per_day: Array<{ date: string; count: number }>;
  emotion_tags: Array<{ tag: string; count: number }>;
  plan_distribution: Array<{ plan: string; count: number }>;
  avg_session_length: number;
}

// Frontend state types
export interface AuthState {
  user: User | null;
  companion: Companion | null;
  subscription: Subscription | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  typing: boolean;
  crisisDetected: boolean;
  crisisResources: Array<{ name: string; contact: string; url: string }>;
  dailyMessageCount: number;
  dailyMessageLimit: number;
}