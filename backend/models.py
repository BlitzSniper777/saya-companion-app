from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


class PlanEnum(str, Enum):
    free = "free"
    companion = "companion"
    gfbf = "gfbf"
    adult_bundle = "adult_bundle"


class SubscriptionStatusEnum(str, Enum):
    active = "active"
    cancelled = "cancelled"
    past_due = "past_due"
    trialing = "trialing"
    incomplete = "incomplete"


# Auth models
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    # Onboarding — collected upfront, companion assigned immediately on register
    user_name: str = Field(..., min_length=1, max_length=100)
    why_came: str
    communication_style: str
    friendship_values: str
    faith_spirituality: str
    user_gender: str = "prefer_not_say"
    companion_gender_preference: str = "no_preference"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# User models
class UserBase(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str]
    language: str
    timezone: str
    onboarding_completed: bool
    created_at: datetime
    user_preferences: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    pass


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    language: Optional[str] = Field(None, max_length=10)
    timezone: Optional[str] = Field(None, max_length=50)



# Companion models
class CompanionBase(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    personality_calibration: Dict[str, Any]
    mode: str
    relationship_length_days: int
    language: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CompanionResponse(CompanionBase):
    pass


class CompanionUpdate(BaseModel):
    mode: Optional[str] = Field(None, pattern="^(friend|romantic|adult)$")
    personality_calibration: Optional[Dict[str, Any]] = None


# Conversation models
class ConversationBase(BaseModel):
    id: UUID
    user_id: UUID
    title: Optional[str]
    summary: Optional[str]
    last_message_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationListResponse(ConversationBase):
    message_count: int = 0
    last_message_preview: Optional[str] = None


class ConversationCreate(BaseModel):
    title: Optional[str] = None


class ConversationResponse(ConversationBase):
    messages: List["MessageResponse"] = []


# Message models
class MessageBase(BaseModel):
    id: UUID
    conversation_id: UUID
    user_id: UUID
    role: str  # "user" or "assistant"
    content: str
    emotion_tags: List[str]
    topic_tags: List[str]
    token_count: int
    metadata: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(MessageBase):
    pass


class MessageListResponse(BaseModel):
    messages: List[MessageResponse]
    has_more: bool


# Chat models
class ChatRequest(BaseModel):
    conversation_id: UUID
    message: str = Field(..., min_length=1, max_length=4000)


class ChatChunk(BaseModel):
    type: str  # "chunk", "complete", "crisis", "error"
    content: Optional[str] = None
    message_id: Optional[UUID] = None
    conversation_id: Optional[UUID] = None
    resources: Optional[List[Dict[str, str]]] = None
    error: Optional[str] = None


# Subscription models
class PlanInfo(BaseModel):
    id: str
    name: str
    price_monthly: float
    price_yearly: float
    price_lifetime: Optional[float] = None
    features: List[str]
    limits: Optional[Dict[str, Any]] = None
    message_limit: Optional[int] = None
    memory_days: Optional[int] = None
    modes: Optional[List[str]] = None
    voice_calls: Optional[bool] = False
    adult_content: Optional[bool] = False


class SubscriptionResponse(BaseModel):
    id: UUID
    user_id: UUID
    plan: str
    status: str
    stripe_customer_id: Optional[str]
    stripe_subscription_id: Optional[str]
    daily_message_count: int
    daily_message_limit: int
    daily_message_reset_at: datetime
    current_period_end: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SubscriptionPlansResponse(BaseModel):
    plans: List[PlanInfo]
    current_plan: str


# Billing models
class CheckoutRequest(BaseModel):
    plan: str = Field(..., pattern="^(companion|gfbf|adult_bundle)$")
    billing_cycle: str = Field("monthly", pattern="^(monthly|yearly|lifetime)$")


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class PortalRequest(BaseModel):
    return_url: str = "http://localhost:3000/subscription"


class PortalResponse(BaseModel):
    portal_url: str


# Crisis models
class CrisisEventResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    message_content: str
    severity: str
    resources_shown: List[str]
    admin_reviewed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CrisisReviewRequest(BaseModel):
    reviewed: bool = True


# Admin models
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminStatsResponse(BaseModel):
    total_users: int
    active_today: int
    messages_today: int
    mrr: float
    subscriptions_by_plan: Dict[str, int]


class AdminUserListItem(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str]
    plan: str
    messages_today: int
    last_active: Optional[datetime]
    is_active: bool
    created_at: datetime


class AdminUserListResponse(BaseModel):
    users: List[AdminUserListItem]
    total: int
    page: int
    page_size: int


class AdminUserDetailResponse(BaseModel):
    user: UserResponse
    companion: Optional[CompanionResponse]
    subscription: Optional[SubscriptionResponse]
    conversation_count: int
    crisis_events: List[CrisisEventResponse]
    consent_logs: List[Dict[str, Any]]


class AdminMessageListItem(BaseModel):
    id: UUID
    conversation_id: UUID
    user_email: str
    role: str
    content: str
    emotion_tags: List[str]
    created_at: datetime


class AdminMessageListResponse(BaseModel):
    messages: List[AdminMessageListItem]
    total: int
    page: int
    page_size: int


class AdminCrisisListResponse(BaseModel):
    crises: List[CrisisEventResponse]
    total: int
    page: int
    page_size: int


class AdminAnalyticsResponse(BaseModel):
    dau: List[Dict[str, Any]]
    wau: List[Dict[str, Any]]
    mau: List[Dict[str, Any]]
    messages_per_day: List[Dict[str, Any]]
    emotion_tags: List[Dict[str, Any]]
    plan_distribution: List[Dict[str, Any]]
    avg_session_length: float


# Health
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str


# Consent
class ConsentLogRequest(BaseModel):
    consent_type: str
    consent_given: bool
    details: Optional[Dict[str, Any]] = {}


# Voice models
class VoiceStartRequest(BaseModel):
    conversation_id: UUID


class VoiceCreditsResponse(BaseModel):
    balance: int
    plan: str
    tier_limits: Dict[str, int]


# Gift models
class GiftCatalogItem(BaseModel):
    id: str
    name: str
    description: str
    price_cents: int
    image_url: str
    category: str  # "standard", "romantic", "spicy"
    gender: str  # "female", "male", "neutral"


class GiftCatalogResponse(BaseModel):
    gifts: List[GiftCatalogItem]


class GiftSendRequest(BaseModel):
    gift_id: str
    conversation_id: UUID


class GiftHistoryItem(BaseModel):
    id: UUID
    gift_id: str
    gift_name: str
    price_cents: int
    sent_at: datetime
    message: Optional[str]


class GiftHistoryResponse(BaseModel):
    gifts: List[GiftHistoryItem]


# Forward references
TokenResponse.update_forward_refs()
ConversationResponse.update_forward_refs()
MessageListResponse.update_forward_refs()