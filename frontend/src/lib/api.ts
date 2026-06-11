import type { ChatChunk, TokenResponse, User, Companion, Subscription, PlanInfo, Conversation, Message, AdminStats, AdminAnalytics, CrisisEvent, OnboardingResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8007";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("saya_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

// Auth
export async function register(data: { email: string; password: string; full_name?: string }): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<TokenResponse>(res);
}

export async function login(data: { email: string; password: string }): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<TokenResponse>(res);
}

export async function refreshToken(refreshToken: string): Promise<{ access_token: string }> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return handleResponse(res);
}

export async function getProfile(): Promise<User> {
  const res = await fetch(`${API_URL}/user/profile`, { headers: getAuthHeaders() });
  return handleResponse<User>(res);
}

export async function updateProfile(data: { full_name?: string; language?: string; timezone?: string }): Promise<User> {
  const res = await fetch(`${API_URL}/user/profile`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<User>(res);
}

export async function completeOnboarding(data: {
  q1_what_brings_you: string;
  q2_communication_style: string;
  q3_friendship_values: string;
  q4_faith_spirituality: string;
  q5_user_name: string;
  companion_name?: string;
}): Promise<OnboardingResponse> {
  const res = await fetch(`${API_URL}/user/onboarding`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<OnboardingResponse>(res);
}

export async function deleteAccount(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/user/account`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Companion
export async function getCompanion(): Promise<Companion> {
  const res = await fetch(`${API_URL}/companion`, { headers: getAuthHeaders() });
  return handleResponse<Companion>(res);
}

export async function updateCompanion(data: { name?: string; mode?: string; personality_calibration?: Record<string, any> }): Promise<Companion> {
  const res = await fetch(`${API_URL}/companion`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Companion>(res);
}

export async function switchCompanionMode(mode: "friend" | "romantic"): Promise<Companion> {
  const res = await fetch(`${API_URL}/companion/mode`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ mode }),
  });
  return handleResponse<Companion>(res);
}

export async function toggleAdultMode(): Promise<Companion> {
  const res = await fetch(`${API_URL}/companion/adult`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return handleResponse<Companion>(res);
}

// Conversations
export async function listConversations(page = 1, pageSize = 20): Promise<Conversation[]> {
  const res = await fetch(`${API_URL}/conversations?page=${page}&page_size=${pageSize}`, { headers: getAuthHeaders() });
  return handleResponse<Conversation[]>(res);
}

export async function createConversation(title?: string): Promise<Conversation> {
  const res = await fetch(`${API_URL}/conversations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ title }),
  });
  return handleResponse<Conversation>(res);
}

export async function getConversation(id: string): Promise<Conversation & { messages: Message[] }> {
  const res = await fetch(`${API_URL}/conversations/${id}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getConversationMessages(id: string, page = 1, pageSize = 50): Promise<{ messages: Message[]; has_more: boolean }> {
  const res = await fetch(`${API_URL}/conversations/${id}/messages?page=${page}&page_size=${pageSize}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function deleteConversation(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/conversations/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Chat SSE
export async function* streamChat(conversationId: string, message: string): AsyncGenerator<ChatChunk> {
  const token = localStorage.getItem("saya_token");
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Chat failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6);
        if (dataStr.trim() === "[DONE]") return;
        try {
          const chunk: ChatChunk = JSON.parse(dataStr);
          yield chunk;
        } catch {
          // Ignore parse errors
        }
      }
    }
  }
}

// Subscription
export async function getSubscription(): Promise<Subscription> {
  const res = await fetch(`${API_URL}/subscription`, { headers: getAuthHeaders() });
  return handleResponse<Subscription>(res);
}

export async function getPlans(): Promise<{ plans: PlanInfo[] }> {
  const res = await fetch(`${API_URL}/subscription/plans`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function upgradeSubscription(plan: string, interval: string): Promise<{ checkout_url: string; session_id: string }> {
  const res = await fetch(`${API_URL}/billing/checkout`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ plan, interval }),
  });
  return handleResponse(res);
}

export async function openBillingPortal(returnUrl?: string): Promise<{ portal_url: string }> {
  const res = await fetch(`${API_URL}/billing/portal`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ return_url: returnUrl }),
  });
  return handleResponse(res);
}

// Voice
export async function getVoiceCredits(): Promise<{ balance: number; plan: string; tier_limits: Record<string, number> }> {
  const res = await fetch(`${API_URL}/voice/credits`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function startVoiceCall(conversationId: string): Promise<any> {
  const res = await fetch(`${API_URL}/voice/start`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ conversation_id: conversationId }),
  });
  return handleResponse(res);
}

export async function endVoiceCall(): Promise<any> {
  const res = await fetch(`${API_URL}/voice/end`, { method: "POST", headers: getAuthHeaders() });
  return handleResponse(res);
}

// Gifts
export async function getGiftCatalog(): Promise<{ gifts: any[]; plan: string }> {
  const res = await fetch(`${API_URL}/gifts/catalog`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function sendGift(giftId: string, conversationId: string): Promise<any> {
  const res = await fetch(`${API_URL}/gifts/send`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ gift_id: giftId, conversation_id: conversationId }),
  });
  return handleResponse(res);
}

export async function getGiftHistory(): Promise<{ gifts: any[] }> {
  const res = await fetch(`${API_URL}/gifts/history`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// Coins
export async function getCoins(): Promise<{ balance: number; total_purchased: number; packs: any[] }> {
  const res = await fetch(`${API_URL}/coins`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function topUpCoins(packId: string): Promise<{ success: boolean; balance: number; coins_added: number; pack: any }> {
  const res = await fetch(`${API_URL}/coins/topup`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ pack_id: packId }),
  });
  return handleResponse(res);
}

// Affection
export async function getAffection(): Promise<any> {
  const res = await fetch(`${API_URL}/affection`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getAffectionLeaderboard(): Promise<{ leaderboard: any[] }> {
  const res = await fetch(`${API_URL}/affection/leaderboard`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// Admin
export async function adminLogin(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const res = await fetch(`${API_URL}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function adminGetStats(): Promise<AdminStats> {
  const token = localStorage.getItem("saya_admin_token");
  const res = await fetch(`${API_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<AdminStats>(res);
}

export async function adminGetUsers(page = 1, pageSize = 20, search = "", plan = "", isActive?: boolean): Promise<any> {
  const token = localStorage.getItem("saya_admin_token");
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) params.set("search", search);
  if (plan) params.set("plan", plan);
  if (isActive !== undefined) params.set("is_active", String(isActive));

  const res = await fetch(`${API_URL}/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  return handleResponse(res);
}

export async function adminGetUser(id: string): Promise<any> {
  const token = localStorage.getItem("saya_admin_token");
  const res = await fetch(`${API_URL}/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return handleResponse(res);
}

export async function adminUpdateUserStatus(id: string, isActive: boolean): Promise<any> {
  const token = localStorage.getItem("saya_admin_token");
  const res = await fetch(`${API_URL}/admin/users/${id}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });
  return handleResponse(res);
}

export async function adminGetMessages(page = 1, pageSize = 50, filters?: { user_id?: string; date_from?: string; date_to?: string; role?: string }): Promise<any> {
  const token = localStorage.getItem("saya_admin_token");
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (filters?.user_id) params.set("user_id", filters.user_id);
  if (filters?.date_from) params.set("date_from", filters.date_from);
  if (filters?.date_to) params.set("date_to", filters.date_to);
  if (filters?.role) params.set("role", filters.role);

  const res = await fetch(`${API_URL}/admin/messages?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  return handleResponse(res);
}

export async function adminGetCrises(page = 1, pageSize = 50, reviewed?: boolean, severity?: string): Promise<any> {
  const token = localStorage.getItem("saya_admin_token");
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (reviewed !== undefined) params.set("reviewed", String(reviewed));
  if (severity) params.set("severity", severity);

  const res = await fetch(`${API_URL}/admin/crisis?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  return handleResponse(res);
}

export async function adminReviewCrisis(id: string): Promise<any> {
  const token = localStorage.getItem("saya_admin_token");
  const res = await fetch(`${API_URL}/admin/crisis/${id}/review`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ reviewed: true }),
  });
  return handleResponse(res);
}

export async function adminGetAnalytics(): Promise<AdminAnalytics> {
  const token = localStorage.getItem("saya_admin_token");
  const res = await fetch(`${API_URL}/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } });
  return handleResponse<AdminAnalytics>(res);
}

// Health
export async function healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
  const res = await fetch(`${API_URL}/health`);
  return handleResponse(res);
}