import { apiRequest } from "@/api/client";
import type { CreateReviewInput, Paginated, Review, ReviewTargetType } from "@/types/mico";

export async function listReviews(targetType: ReviewTargetType, targetId: string, page = 1) {
  const params = new URLSearchParams({ targetType, targetId, page: String(page) });
  return apiRequest<Paginated<Review>>(`/reviews?${params.toString()}`);
}

export async function createReview(input: CreateReviewInput) {
  return apiRequest<Review>("/reviews", { method: "POST", body: JSON.stringify(input) });
}
