export type CraftsmanSpecialty =
  | "ENGINE"
  | "ELECTRICAL"
  | "HULL_FIBERGLASS"
  | "UPHOLSTERY_CANVAS"
  | "WINTERIZATION_MAINTENANCE"
  | "OTHER";

export const SPECIALTY_LABELS: Record<CraftsmanSpecialty, string> = {
  ENGINE: "Motor",
  ELECTRICAL: "Elektrik/Elektronik",
  HULL_FIBERGLASS: "Fiber/Gövde",
  UPHOLSTERY_CANVAS: "Döşeme/Branda",
  WINTERIZATION_MAINTENANCE: "Kışlama/Bakım",
  OTHER: "Diğer",
};

export type Craftsman = {
  id: string;
  userId: string;
  businessName: string | null;
  specialty: CraftsmanSpecialty;
  bio: string | null;
  city: string;
  marina: string | null;
  experienceYears: number | null;
  avatar: string | null;
  isVerified: boolean;
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
  tokenBalance: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  distanceKm: number | null;
};

/** Bir teklif vermenin maliyeti ("Teklif Hakkı") — backend service-offers/service.ts OFFER_TOKEN_COST ile eslesmeli. */
export const OFFER_TOKEN_COST = 1;

export type ServiceRequestStatus = "OPEN" | "OFFER_RECEIVED" | "ASSIGNED" | "COMPLETED" | "CANCELLED";

export type ServiceRequest = {
  id: string;
  ownerId: string;
  boatId: string | null;
  specialty: CraftsmanSpecialty;
  title: string;
  description: string;
  photos: string[];
  city: string;
  marina: string | null;
  isUrgent: boolean;
  status: ServiceRequestStatus;
  createdAt: string;
  updatedAt: string;
  /** Sadece bazı uç noktalarda (ör. /service-requests/my-jobs) dolu gelir. */
  owner?: { id: string; name: string };
};

export type CreateServiceRequestInput = {
  boatId?: string;
  specialty: CraftsmanSpecialty;
  title: string;
  description: string;
  photos?: string[];
  city: string;
  marina?: string;
  latitude?: number;
  longitude?: number;
  isUrgent?: boolean;
};

export type ServiceOfferStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";

export type ServiceOffer = {
  id: string;
  serviceRequestId: string;
  craftsmanId: string;
  message: string | null;
  priceEstimate: number | null;
  status: ServiceOfferStatus;
  contactUnlocked: boolean;
  createdAt: string;
  craftsman?: Craftsman;
};

export type Conversation = {
  id: string;
  participantAId: string;
  participantBId: string;
  contextType: "DIRECT" | "SERVICE_REQUEST" | "MARKET_LISTING" | "USED_BOAT_LISTING";
  contextId: string | null;
  lastMessageAt: string;
  participantA: { id: string; name: string; email: string };
  participantB: { id: string; name: string; email: string };
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  imageUrl: string | null;
  readAt: string | null;
  deletedAt: string | null;
  createdAt: string;
};

export type NotificationType =
  | "MAINTENANCE_DUE"
  | "SERVICE_OFFER_RECEIVED"
  | "SERVICE_OFFER_ACCEPTED"
  | "SERVICE_OFFER_DECLINED"
  | "SERVICE_REQUEST_CANCELLED"
  | "SERVICE_REQUEST_COMPLETED"
  | "NEW_MESSAGE"
  | "REVIEW_RECEIVED"
  | "CRAFTSMAN_APPROVED"
  | "CRAFTSMAN_REJECTED"
  | "TOKEN_LOW"
  | "ADMIN_ANNOUNCEMENT";

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: unknown;
  readAt: string | null;
  createdAt: string;
};

export type ReviewTargetType = "CRAFTSMAN" | "MARKET_LISTING" | "USED_BOAT_LISTING";

export type Review = {
  id: string;
  authorId: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment: string | null;
  serviceRequestId: string | null;
  createdAt: string;
  author?: { id: string; name: string };
};

export type CreateReviewInput = {
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment?: string;
  serviceRequestId?: string;
};

export type FavoriteTargetType = "CRAFTSMAN" | "MARKET_LISTING" | "USED_BOAT_LISTING" | "COMPANY";

export type Favorite = {
  id: string;
  userId: string;
  targetType: FavoriteTargetType;
  targetId: string;
  createdAt: string;
};

export type Paginated<T> = { items: T[]; page: number; pageSize: number; hasMore: boolean };

export type BlockedUser = { id: string; name: string; avatarUrl: string | null };

export type ReportReason = "INAPPROPRIATE_CONTENT" | "SPAM" | "FRAUD" | "OTHER";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  INAPPROPRIATE_CONTENT: "Uygunsuz içerik",
  SPAM: "Spam",
  FRAUD: "Dolandırıcılık",
  OTHER: "Diğer",
};

export type CreateReportInput = {
  reportedUserId: string;
  reason: ReportReason;
  details?: string;
  contextType?: string;
  contextId?: string;
};
