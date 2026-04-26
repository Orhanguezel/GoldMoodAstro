import { apiFetch, apiPost } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { Review, ReviewListParams, CreateReviewRequest } from '../types/review.type';
import type { PaginatedResponse } from '../types/common.type';

export function getReviews(
  baseUrl: string,
  params?: ReviewListParams,
): Promise<PaginatedResponse<Review>> {
  return apiFetch<PaginatedResponse<Review>>(baseUrl, API_ENDPOINTS.PUBLIC.REVIEWS.LIST, params as Record<string, unknown>);
}

export function createReview(
  baseUrl: string,
  data: CreateReviewRequest,
): Promise<Review> {
  return apiPost<Review>(baseUrl, API_ENDPOINTS.PUBLIC.REVIEWS.LIST, data);
}

export function addReviewReaction(
  baseUrl: string,
  reviewId: string,
): Promise<{ helpful_count: number }> {
  return apiPost<{ helpful_count: number }>(baseUrl, API_ENDPOINTS.PUBLIC.REVIEWS.REACTIONS(reviewId), {});
}
